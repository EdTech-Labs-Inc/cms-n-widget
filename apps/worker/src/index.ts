#!/usr/bin/env node
/**
 * BullMQ Worker - Media Generation
 * Standalone worker process for processing background jobs
 */

import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir + '/../backend');

import { Worker, Job } from 'bullmq';
import { getWorkerRedisConnection, JobTypes } from '../../backend/lib/config/queue';
import { audioService } from '../../backend/lib/services/media/audio.service';
import { quizService } from '../../backend/lib/services/media/quiz.service';
import { podcastService } from '../../backend/lib/services/media/podcast.service';
import { videoGeneratorService } from '../../backend/lib/services/media/video-generator.service';
import { videoWebhookService } from '../../backend/lib/services/media/video-webhook.service';
import { interactivePodcastGeneratorService } from '../../backend/lib/services/media/interactive-podcast-generator.service';
import { thumbnailService } from '../../backend/lib/services/media/thumbnail.service';
import { submissionService } from '../../backend/lib/services/submission.service';
import { queueService } from '../../backend/lib/services/core/queue.service';
import { timeoutMonitorService } from '../../backend/lib/services/core/timeout-monitor.service';
import { prisma } from '../../backend/lib/config/database';
import { validateConfig } from '../../backend/lib/config/constants';
import { logger } from '@repo/logging';

// Job data interfaces
interface MediaJobData {
  articleId: string;
  submissionId: string;
  outputId: string;
  language: string;
  organizationId: string;
}

interface ArticleThumbnailJobData {
  articleId: string;
  title: string;
  organizationId: string;
}

interface VideoCompletionJobData {
  heygenVideoId: string;
  videoUrl: string;
}

/**
 * Worker handler - processes media generation jobs
 */
const processMediaJob = async (job: Job<MediaJobData | ArticleThumbnailJobData | VideoCompletionJobData>) => {
  logger.info('Job started', { jobId: job.id, jobName: job.name, data: job.data });

  try {
    switch (job.name) {
      case JobTypes.GENERATE_AUDIO: {
        const { articleId, submissionId, outputId, language, organizationId } = job.data as MediaJobData;
        await audioService.generateAudio(articleId, outputId, organizationId);
        // Update submission status after job completes
        await submissionService.updateSubmissionStatus(submissionId);
        logger.info('Job completed', { jobName: job.name, articleId, language, outputId });
        break;
      }

      case JobTypes.GENERATE_QUIZ: {
        const { articleId, submissionId, outputId, language, organizationId } = job.data as MediaJobData;
        await quizService.generateQuiz(articleId, outputId, language, organizationId);
        // Update submission status after job completes
        await submissionService.updateSubmissionStatus(submissionId);
        logger.info('Job completed', { jobName: job.name, articleId, language, outputId });
        break;
      }

      case JobTypes.GENERATE_PODCAST: {
        const { articleId, submissionId, outputId, language, organizationId } = job.data as MediaJobData;
        await podcastService.generatePodcast(articleId, outputId, organizationId);

        // Update submission status after job completes
        await submissionService.updateSubmissionStatus(submissionId);
        logger.info('Job completed', { jobName: job.name, articleId, language, outputId });
        break;
      }

      case JobTypes.GENERATE_VIDEO: {
        const { articleId, submissionId, language, organizationId } = job.data as MediaJobData;
        // Video generation includes bubble questions automatically
        await videoGeneratorService.generateVideos(articleId, language, organizationId);
        // Update submission status after job completes
        await submissionService.updateSubmissionStatus(submissionId);
        logger.info('Job completed', { jobName: job.name, articleId, language });
        break;
      }

      case JobTypes.PROCESS_VIDEO_COMPLETION: {
        const { heygenVideoId, videoUrl } = job.data as VideoCompletionJobData;
        logger.info('Processing video completion', { heygenVideoId, videoUrl });

        // Process video completion (download, transcribe, generate bubbles)
        const success = await videoWebhookService.handleVideoCompletion(heygenVideoId, videoUrl);

        if (!success) {
          throw new Error(`Failed to process video completion for ${heygenVideoId}`);
        }

        logger.info('Video processing completed', { heygenVideoId });
        break;
      }

      case JobTypes.GENERATE_INTERACTIVE_PODCAST: {
        const { articleId, submissionId, outputId, language, organizationId } = job.data as MediaJobData;
        // Standalone interactive podcast generation (no podcast dependency)
        await interactivePodcastGeneratorService.generateInteractivePodcast(articleId, outputId, organizationId);
        // Update submission status after job completes
        await submissionService.updateSubmissionStatus(submissionId);
        logger.info('Job completed', { jobName: job.name, articleId, language, outputId });
        break;
      }

      case JobTypes.GENERATE_ARTICLE_THUMBNAIL: {
        const { articleId, title, organizationId } = job.data as ArticleThumbnailJobData;
        logger.info('Generating article thumbnail', { jobId: job.id, articleId, title, organizationId });

        const thumbnailUrl = await thumbnailService.generateThumbnail(
          title,
          'article',
          articleId,
          organizationId
        );
        logger.info('Thumbnail generated', { articleId, thumbnailUrl });

        await prisma.article.update({
          where: { id: articleId },
          data: { thumbnailUrl },
        });
        logger.info('Article thumbnail job completed', { articleId, thumbnailUrl });
        break;
      }

      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }

    return { success: true };
  } catch (error) {
    logger.error('Job failed', { jobId: job.id, jobName: job.name, error: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined });
    throw error; // This will trigger BullMQ retry logic
  }
};


async function main() {
  validateConfig();

  // Explicitly connect to Redis before creating worker
  logger.info('Connecting to Redis', { redisUrl: process.env.REDIS_URL?.replace(/:[^:@]+@/, ':***@') });
  const redis = getWorkerRedisConnection();

  try {
    await redis.connect();
    logger.info('Redis connected successfully', { redisUrl: process.env.REDIS_URL?.replace(/:[^:@]+@/, ':***@') });
  } catch (error) {
    logger.error('Failed to connect to Redis', { error: error instanceof Error ? error.message : 'Unknown error', redisUrl: process.env.REDIS_URL?.replace(/:[^:@]+@/, ':***@') });
    process.exit(1);
  }

  // Create worker with already-connected Redis
  const mediaGenerationWorker = new Worker('media-generation', processMediaJob, {
    connection: redis,
    // IMPORTANT: Must match the prefix used in Queue configuration
    prefix: 'bull:{media}',
    concurrency: 2, // Reduced to 2 to stay under ElevenLabs limit (max 5 concurrent requests)
    removeOnComplete: { count: 100 }, // Keep last 100 completed jobs
    removeOnFail: { count: 500 }, // Keep last 500 failed jobs
  });

  // Worker event handlers
  mediaGenerationWorker.on('completed', (job) => {
    logger.info('Job completed event', { jobId: job.id, jobName: job.name });
  });

  mediaGenerationWorker.on('failed', (job, error) => {
    logger.error('Job failed event', { jobId: job?.id, jobName: job?.name, error: error.message });
  });

  mediaGenerationWorker.on('error', (error) => {
    logger.error('Worker error', { error: error instanceof Error ? error.message : 'Unknown error' });
  });

  // Start timeout monitoring (runs every 30 minutes)
  const TIMEOUT_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes
  logger.info('Starting timeout monitor', {
    checkIntervalMinutes: TIMEOUT_CHECK_INTERVAL / 1000 / 60,
    timeoutThresholdMinutes: 30
  });

  // Run immediately on startup to clean up any existing stuck outputs
  timeoutMonitorService.checkAndMarkStuckOutputs().catch((error) => {
    logger.error('Initial timeout monitor check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
  });

  // Then run every 30 minutes
  const timeoutMonitorInterval = setInterval(async () => {
    try {
      await timeoutMonitorService.checkAndMarkStuckOutputs();
    } catch (error) {
      logger.error('Timeout monitor error', { error: error instanceof Error ? error.message : 'Unknown error' });
      // Don't crash the worker - just log and continue
    }
  }, TIMEOUT_CHECK_INTERVAL);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('Shutting down worker', { signal: 'SIGTERM' });
    clearInterval(timeoutMonitorInterval);
    await mediaGenerationWorker.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('Shutting down worker', { signal: 'SIGINT' });
    clearInterval(timeoutMonitorInterval);
    await mediaGenerationWorker.close();
    process.exit(0);
  });

  logger.info('Media generation worker started', { environment: process.env.NODE_ENV || 'development', concurrency: 2 });
}

// Call async main and handle errors
main().catch((error) => {
  logger.error('Fatal error in worker startup', { error: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined });
  process.exit(1);
});
