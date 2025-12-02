import { awsTranscribeService } from '../external/aws-transcribe.service';
import { storageService } from '../core/storage.service';
import { aiTaggingService } from '../ai-tagging.service';
import { thumbnailService } from './thumbnail.service';
import { bubbleGeneratorService } from './bubble-generator.service';
import { prisma } from '../../config/database';
import { logger } from '@repo/logging';

/**
 * Video Webhook Service - Handle HeyGen video completion/failure webhooks
 *
 * Handles:
 * - Video completion callback (download, transcribe, generate bubbles)
 * - Video failure callback
 * - Updating submission status after video processing
 */
export class VideoWebhookService {
  /**
   * Handle video completion webhook from HeyGen
   * Called when HeyGen notifies that a video is ready
   * Returns true on success, false on failure
   */
  async handleVideoCompletion(heygenVideoId: string, videoUrl: string): Promise<boolean> {
    try {
      logger.info('Processing completed video', { heygenVideoId });

      // Find the VideoOutput record with this HeyGen video ID
      const videoOutput = await prisma.videoOutput.findFirst({
        where: {
          heygenVideoId: heygenVideoId,
          status: 'PROCESSING',
        },
        include: {
          submission: {
            include: {
              article: true,
            },
          },
        },
      });

      if (!videoOutput) {
        logger.error('No video output found for HeyGen video', { heygenVideoId });
        return false;
      }

      const article = videoOutput.submission.article;

      logger.info('Downloading video from HeyGen and uploading to S3');

      // Get organizationId from article
      const orgId = article.organizationId;

      // Download video from HeyGen and upload to S3 (returns both CloudFront and S3 URLs)
      const filename = `${heygenVideoId}.mp4`;
      const uploadResult = await storageService.uploadVideoFromUrl(
        videoUrl,
        videoOutput.submissionId,
        filename,
        orgId
      );

      logger.info('Video uploaded to S3', {
        cloudfrontUrl: uploadResult.cloudfrontUrl,
        s3Url: uploadResult.s3Url
      });

      // Get video metadata with AWS Transcribe (word-level timings)
      // Use S3 URL (not CloudFront) as Transcribe requires direct S3 access
      const language = videoOutput.submission.language || 'ENGLISH';
      const { duration, transcript, wordTimings } = await this.getVideoMetadata(uploadResult.s3Url, language);

      // Generate bubble questions in the submission's language using word timings
      // Only generate if generateBubbles is not explicitly disabled
      let bubbles: any[] = [];
      if (videoOutput.generateBubbles !== false) {
        bubbles = await bubbleGeneratorService.generateVideoBubbles(
          videoOutput.script || '',
          article.content,
          transcript,
          duration,
          language,
          wordTimings
        );
        logger.info('Generated bubble questions for video', { bubbleCount: bubbles.length });
      } else {
        logger.info('Bubble generation skipped (generateBubbles=false)', { videoOutputId: videoOutput.id });
      }

      // Generate thumbnail for video
      let thumbnailUrl: string | null = null;
      try {
        thumbnailUrl = await thumbnailService.generateThumbnail(videoOutput.title || article.title, 'video', videoOutput.id, orgId);
      } catch (error) {
        logger.warn('Failed to generate video thumbnail', { error: error instanceof Error ? error.message : error });
        // Continue without thumbnail - not critical
      }

      // 🔴 CRITICAL SCHEMA UPDATE: Create VideoBubble rows (not JSON)
      if (bubbles.length > 0) {
        await prisma.videoBubble.createMany({
          data: bubbles.map((bubble: any, index: number) => ({
            videoOutputId: videoOutput.id,
            appearsAt: bubble.appearsAt, // Timestamp in milliseconds
            order: index,
            question: bubble.question,
            options: bubble.options,
            correctAnswer: bubble.correctAnswer,
            explanation: bubble.explanation,
          }))
        });
        logger.info('Created VideoBubble rows in database', { count: bubbles.length });
      }

      // Update the VideoOutput record with completed video data (use CloudFront URL for user delivery)
      await prisma.videoOutput.update({
        where: { id: videoOutput.id },
        data: {
          videoUrl: uploadResult.cloudfrontUrl,
          thumbnailUrl: thumbnailUrl,
          duration,
          transcript,
          wordTimings: wordTimings as any, // Store detailed word-level timings
          status: 'COMPLETED',
        },
      });

      logger.info('Video processed successfully', {
        heygenVideoId,
        videoOutputId: videoOutput.id
      });

      // Auto-tag the video output (only for English)
      await aiTaggingService.tagVideoOutput(videoOutput.id);

      // Check if all videos for this submission are completed
      const { submissionService } = await import('../submission.service');
      await submissionService.updateSubmissionStatus(videoOutput.submissionId);

      return true;
    } catch (error) {
      logger.error('Error processing video completion', {
        heygenVideoId,
        error: error instanceof Error ? error.message : error
      });
      return false;
    }
  }

  /**
   * Handle video failure webhook from HeyGen
   * Returns true on success, false on failure
   */
  async handleVideoFailure(heygenVideoId: string, errorMessage: string): Promise<boolean> {
    try {
      logger.error('Processing failed video', { heygenVideoId, errorMessage });

      // Find the VideoOutput record with this HeyGen video ID
      const videoOutput = await prisma.videoOutput.findFirst({
        where: {
          heygenVideoId: heygenVideoId,
          status: 'PROCESSING',
        },
      });

      if (!videoOutput) {
        logger.error('No video output found for failed HeyGen video', { heygenVideoId });
        return false;
      }

      // Update VideoOutput to FAILED status
      await prisma.videoOutput.update({
        where: { id: videoOutput.id },
        data: {
          status: 'FAILED',
          error: errorMessage,
        },
      });

      logger.info('Video marked as FAILED', {
        heygenVideoId,
        videoOutputId: videoOutput.id
      });

      // Update submission status
      const { submissionService } = await import('../submission.service');
      await submissionService.updateSubmissionStatus(videoOutput.submissionId);

      return true;
    } catch (error) {
      logger.error('Error processing video failure', {
        heygenVideoId,
        error: error instanceof Error ? error.message : error
      });
      return false;
    }
  }

  /**
   * Get video metadata from completed video using AWS Transcribe
   */
  private async getVideoMetadata(
    s3VideoUrl: string,
    language: string = 'ENGLISH'
  ): Promise<{
    duration: number;
    transcript: string;
    wordTimings: Array<{ text: string; start_time: number; end_time: number }>;
  }> {
    try {
      logger.info('Getting video metadata via AWS Transcribe');

      // Use AWS Transcribe to get detailed transcript with word-level timings
      const { transcript, wordTimings, duration } = await awsTranscribeService.transcribeVideo(
        s3VideoUrl,
        language
      );

      logger.info('Transcription complete', {
        duration,
        wordCount: wordTimings.length
      });

      return { duration, transcript, wordTimings };
    } catch (error) {
      logger.error('Error getting video metadata', {
        error: error instanceof Error ? error.message : error
      });
      // Return fallback values if transcription fails
      return {
        duration: 120,
        transcript: 'Transcript not available',
        wordTimings: [],
      };
    }
  }
}

// Singleton instance
export const videoWebhookService = new VideoWebhookService();
