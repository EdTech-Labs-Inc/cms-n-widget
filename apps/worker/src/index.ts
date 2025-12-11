#!/usr/bin/env node
/**
 * BullMQ Worker - Media Generation
 * Standalone worker process for processing background jobs
 *
 * Environment variables are set by the container in production.
 * For local development, run with: tsx --env-file=../backend/.env src/index.ts
 */

import { Worker, Job } from 'bullmq';
import { getWorkerRedisConnection, JobTypes } from '../../backend/lib/config/queue';
import { audioService } from '../../backend/lib/services/media/audio.service';
import { quizService } from '../../backend/lib/services/media/quiz.service';
import { podcastService } from '../../backend/lib/services/media/podcast.service';
import { videoGeneratorService } from '../../backend/lib/services/media/video-generator.service';
import { videoWebhookService } from '../../backend/lib/services/media/video-webhook.service';
import { interactivePodcastGeneratorService } from '../../backend/lib/services/media/interactive-podcast-generator.service';
import { thumbnailService } from '../../backend/lib/services/media/thumbnail.service';
// Script-first flow services
import { videoScriptService } from '../../backend/lib/services/media/video-script.service';
import { podcastScriptService } from '../../backend/lib/services/media/podcast-script.service';
import { interactivePodcastScriptService } from '../../backend/lib/services/media/interactive-podcast-script.service';
// Media-from-script services
import { videoMediaService } from '../../backend/lib/services/media/video-media.service';
import { podcastMediaService } from '../../backend/lib/services/media/podcast-media.service';
import { interactivePodcastMediaService } from '../../backend/lib/services/media/interactive-podcast-media.service';
// Standalone video service
import { standaloneVideoService } from '../../backend/lib/services/media/standalone-video.service';
// Video post-processing service (bumpers, music)
import { videoPostProcessingService } from '../../backend/lib/services/media/video-postprocessing.service';
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

// Media-from-script job data interfaces
interface VideoMediaJobData {
  videoOutputId: string;
  submissionId: string;
  organizationId: string;
}

interface PodcastMediaJobData {
  podcastOutputId: string;
  submissionId: string;
  organizationId: string;
  voiceSelection?: {
    interviewerVoiceId?: string;
    guestVoiceId?: string;
  };
}

interface InteractivePodcastMediaJobData {
  interactivePodcastOutputId: string;
  submissionId: string;
  organizationId: string;
  voiceSelection?: {
    voiceId?: string;
  };
}

// Standalone video job data interface
interface StandaloneVideoJobData {
  standaloneVideoId: string;
  organizationId: string;
}

// Standalone video post-processing job data interface
interface StandaloneVideoPostProcessingJobData {
  standaloneVideoId: string;
  organizationId: string;
  editedVideoUrl: string;
}

// VideoOutput post-processing job data interface (for edu videos)
interface VideoOutputPostProcessingJobData {
  videoOutputId: string;
  editedVideoUrl: string;
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

      // ============================================
      // SCRIPT-ONLY GENERATION JOBS (Script-First Flow)
      // These generate scripts and set status to SCRIPT_READY
      // ============================================

      case JobTypes.GENERATE_VIDEO_SCRIPT: {
        const { articleId, submissionId, outputId, language, organizationId } = job.data as MediaJobData;
        await videoScriptService.generateVideoScript(articleId, outputId, language, organizationId);
        // Update submission status after job completes
        await submissionService.updateSubmissionStatus(submissionId);
        logger.info('Job completed', { jobName: job.name, articleId, language, outputId });
        break;
      }

      case JobTypes.GENERATE_PODCAST_TRANSCRIPT: {
        const { articleId, submissionId, outputId, language, organizationId } = job.data as MediaJobData;
        await podcastScriptService.generatePodcastTranscript(articleId, outputId, language, organizationId);
        // Update submission status after job completes
        await submissionService.updateSubmissionStatus(submissionId);
        logger.info('Job completed', { jobName: job.name, articleId, language, outputId });
        break;
      }

      case JobTypes.GENERATE_INTERACTIVE_PODCAST_SCRIPT: {
        const { articleId, submissionId, outputId, language, organizationId } = job.data as MediaJobData;
        await interactivePodcastScriptService.generateInteractivePodcastScript(articleId, outputId, language, organizationId);
        // Update submission status after job completes
        await submissionService.updateSubmissionStatus(submissionId);
        logger.info('Job completed', { jobName: job.name, articleId, language, outputId });
        break;
      }

      // ============================================
      // MEDIA-FROM-SCRIPT GENERATION JOBS
      // These generate media from approved scripts
      // ============================================

      case JobTypes.GENERATE_VIDEO_FROM_SCRIPT: {
        const { videoOutputId, submissionId } = job.data as VideoMediaJobData;
        // Video customization is already saved on the VideoOutput by the API endpoint
        await videoMediaService.generateVideoFromScript(videoOutputId);
        // Note: Video completion is handled by HeyGen webhook, not here
        // Status will be updated when webhook fires
        logger.info('Job completed - HeyGen video initiated', { jobName: job.name, videoOutputId });
        break;
      }

      case JobTypes.GENERATE_PODCAST_FROM_TRANSCRIPT: {
        const { podcastOutputId, submissionId, voiceSelection } = job.data as PodcastMediaJobData;
        await podcastMediaService.generatePodcastFromTranscript(podcastOutputId, voiceSelection);
        // Update submission status after job completes
        await submissionService.updateSubmissionStatus(submissionId);
        logger.info('Job completed', { jobName: job.name, podcastOutputId });
        break;
      }

      case JobTypes.GENERATE_INTERACTIVE_PODCAST_FROM_SCRIPT: {
        const { interactivePodcastOutputId, submissionId, voiceSelection } = job.data as InteractivePodcastMediaJobData;
        await interactivePodcastMediaService.generateFromScript(interactivePodcastOutputId, voiceSelection);
        // Update submission status after job completes
        await submissionService.updateSubmissionStatus(submissionId);
        logger.info('Job completed', { jobName: job.name, interactivePodcastOutputId });
        break;
      }

      // ============================================
      // STANDALONE VIDEO GENERATION
      // Video from standalone create page (no Article/Submission)
      // ============================================

      case JobTypes.GENERATE_STANDALONE_VIDEO: {
        const { standaloneVideoId, organizationId } = job.data as StandaloneVideoJobData;
        await standaloneVideoService.generateVideo(standaloneVideoId);
        // Note: Video completion is handled by HeyGen webhook
        // Status will be updated when webhook fires
        logger.info('Job completed - HeyGen video initiated', { jobName: job.name, standaloneVideoId });
        break;
      }

      case JobTypes.POST_PROCESS_STANDALONE_VIDEO: {
        const { standaloneVideoId, organizationId, editedVideoUrl } = job.data as StandaloneVideoPostProcessingJobData;
        logger.info('Post-processing standalone video', { standaloneVideoId, editedVideoUrl });

        // Get the standalone video with bumper and music details
        const standaloneVideo = await prisma.standaloneVideo.findUnique({
          where: { id: standaloneVideoId },
          include: {
            backgroundMusic: true,
            startBumper: true,
            endBumper: true,
          },
        });

        if (!standaloneVideo) {
          throw new Error(`StandaloneVideo ${standaloneVideoId} not found`);
        }

        // Check if any post-processing is needed
        const needsPostProcessing =
          standaloneVideo.startBumper ||
          standaloneVideo.endBumper ||
          standaloneVideo.backgroundMusic;

        let finalVideoUrl: string;
        let finalDuration: number;

        if (needsPostProcessing) {
          // Build post-processing params
          const postProcessParams: Parameters<typeof videoPostProcessingService.processVideo>[0] = {
            videoUrl: editedVideoUrl,
            standaloneVideoId,
            organizationId,
          };

          // Add start bumper if configured
          if (standaloneVideo.startBumper) {
            postProcessParams.startBumper = {
              mediaUrl: standaloneVideo.startBumper.mediaUrl,
              type: standaloneVideo.startBumper.type as 'image' | 'video',
              duration: standaloneVideo.startBumperDuration || standaloneVideo.startBumper.duration || 3,
            };
          }

          // Add end bumper if configured
          if (standaloneVideo.endBumper) {
            postProcessParams.endBumper = {
              mediaUrl: standaloneVideo.endBumper.mediaUrl,
              type: standaloneVideo.endBumper.type as 'image' | 'video',
              duration: standaloneVideo.endBumperDuration || standaloneVideo.endBumper.duration || 3,
            };
          }

          // Add background music if configured
          if (standaloneVideo.backgroundMusic) {
            postProcessParams.music = {
              audioUrl: standaloneVideo.backgroundMusic.audioUrl,
              volume: standaloneVideo.backgroundMusicVolume,
            };
          }

          // Run FFmpeg post-processing
          const result = await videoPostProcessingService.processVideo(postProcessParams);
          finalVideoUrl = result.cloudfrontUrl;
          finalDuration = result.duration;
        } else {
          // No post-processing needed - just download and re-upload to our S3
          logger.info('No bumpers/music configured, uploading video directly to S3');
          const { storageService } = await import('../../backend/lib/services/core/storage.service');

          const response = await fetch(editedVideoUrl);
          if (!response.ok) {
            throw new Error(`Failed to download video from Submagic: ${response.statusText}`);
          }
          const videoBuffer = Buffer.from(await response.arrayBuffer());

          const filePath = `organizations/${organizationId}/videos/${standaloneVideoId}/final-video.mp4`;
          const uploadResult = await storageService.uploadFile(videoBuffer, filePath, 'video/mp4');

          finalVideoUrl = uploadResult.cloudfrontUrl;
          // Estimate duration from the Submagic video (we don't have exact duration without FFprobe)
          finalDuration = 0; // Will be set by player on load
        }

        // Update StandaloneVideo with final URL and mark as complete
        await prisma.standaloneVideo.update({
          where: { id: standaloneVideoId },
          data: {
            status: 'COMPLETED',
            videoUrl: finalVideoUrl,
            ...(finalDuration > 0 ? { duration: finalDuration } : {}),
          },
        });

        logger.info('Standalone video post-processing completed', {
          standaloneVideoId,
          videoUrl: finalVideoUrl,
          duration: finalDuration,
          hadPostProcessing: needsPostProcessing,
        });
        break;
      }

      case JobTypes.POST_PROCESS_VIDEO_OUTPUT: {
        const { videoOutputId, editedVideoUrl } = job.data as VideoOutputPostProcessingJobData;
        logger.info('Post-processing VideoOutput (edu video)', { videoOutputId, editedVideoUrl });

        // Get the VideoOutput with bumper and music details
        const videoOutput = await prisma.videoOutput.findUnique({
          where: { id: videoOutputId },
          include: {
            submission: true,
            backgroundMusic: true,
            startBumper: true,
            endBumper: true,
          },
        });

        if (!videoOutput) {
          throw new Error(`VideoOutput ${videoOutputId} not found`);
        }

        // Check if any post-processing is needed
        const needsVideoPostProcessing =
          videoOutput.startBumper ||
          videoOutput.endBumper ||
          videoOutput.backgroundMusic;

        let finalVideoUrl: string;

        if (needsVideoPostProcessing) {
          // Build post-processing params
          const postProcessParams: Parameters<typeof videoPostProcessingService.processVideo>[0] = {
            videoUrl: editedVideoUrl,
            videoOutputId,
            organizationId: videoOutput.submission.organizationId,
          };

          // Add start bumper if configured
          if (videoOutput.startBumper) {
            postProcessParams.startBumper = {
              mediaUrl: videoOutput.startBumper.mediaUrl,
              type: videoOutput.startBumper.type as 'image' | 'video',
              duration: videoOutput.startBumperDuration || videoOutput.startBumper.duration || 3,
            };
          }

          // Add end bumper if configured
          if (videoOutput.endBumper) {
            postProcessParams.endBumper = {
              mediaUrl: videoOutput.endBumper.mediaUrl,
              type: videoOutput.endBumper.type as 'image' | 'video',
              duration: videoOutput.endBumperDuration || videoOutput.endBumper.duration || 3,
            };
          }

          // Add background music if configured
          if (videoOutput.backgroundMusic) {
            postProcessParams.music = {
              audioUrl: videoOutput.backgroundMusic.audioUrl,
              volume: videoOutput.backgroundMusicVolume,
            };
          }

          // Run FFmpeg post-processing
          const result = await videoPostProcessingService.processVideo(postProcessParams);
          finalVideoUrl = result.cloudfrontUrl;
        } else {
          // No post-processing needed - use the edited video URL directly
          finalVideoUrl = editedVideoUrl;
        }

        // Queue the video completion job (for transcription + bubbles)
        await queueService.addVideoCompletionJob({
          heygenVideoId: videoOutput.heygenVideoId!,
          videoUrl: finalVideoUrl,
        });

        logger.info('VideoOutput post-processing completed, queued video completion', {
          videoOutputId,
          videoUrl: finalVideoUrl,
          hadPostProcessing: needsVideoPostProcessing,
        });
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
