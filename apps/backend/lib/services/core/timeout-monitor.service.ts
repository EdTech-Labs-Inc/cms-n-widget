import { prisma } from '../../config/database';
import { submissionService } from '../submission.service';
import { logger } from '@repo/logging';

/**
 * Timeout Monitor Service
 *
 * Monitors media outputs stuck in PROCESSING state and marks them as FAILED
 * after a timeout threshold (default: 30 minutes).
 *
 * This handles critical scenarios where:
 * 1. Webhooks never arrive (HeyGen, Submagic)
 * 2. Worker crashes before calling updateSubmissionStatus()
 * 3. Jobs fail without proper error handling
 */
export class TimeoutMonitorService {
  // Timeout threshold: 30 minutes in milliseconds
  private readonly TIMEOUT_THRESHOLD = 30 * 60 * 1000;

  /**
   * Check all media output types for stuck PROCESSING states
   * and mark them as FAILED with timeout error
   */
  async checkAndMarkStuckOutputs(): Promise<void> {
    const thresholdDate = new Date(Date.now() - this.TIMEOUT_THRESHOLD);

    logger.info('Starting timeout monitor check', {
      timestamp: new Date().toISOString(),
      thresholdDate: thresholdDate.toISOString(),
      timeoutMinutes: this.TIMEOUT_THRESHOLD / 60 / 1000,
    });

    const affectedSubmissionIds = new Set<string>();
    let totalStuckOutputs = 0;

    try {
      // 1. Check AudioOutputs
      const stuckAudio = await this.checkAudioOutputs(thresholdDate, affectedSubmissionIds);
      totalStuckOutputs += stuckAudio;

      // 2. Check VideoOutputs
      const stuckVideo = await this.checkVideoOutputs(thresholdDate, affectedSubmissionIds);
      totalStuckOutputs += stuckVideo;

      // 3. Check PodcastOutputs
      const stuckPodcast = await this.checkPodcastOutputs(thresholdDate, affectedSubmissionIds);
      totalStuckOutputs += stuckPodcast;

      // 4. Check QuizOutputs
      const stuckQuiz = await this.checkQuizOutputs(thresholdDate, affectedSubmissionIds);
      totalStuckOutputs += stuckQuiz;

      // 5. Check InteractivePodcastOutputs
      const stuckInteractivePodcast = await this.checkInteractivePodcastOutputs(thresholdDate, affectedSubmissionIds);
      totalStuckOutputs += stuckInteractivePodcast;

      // Update all affected submission statuses
      if (affectedSubmissionIds.size > 0) {
        logger.info('Updating affected submissions', {
          affectedCount: affectedSubmissionIds.size,
        });

        for (const submissionId of affectedSubmissionIds) {
          try {
            await submissionService.updateSubmissionStatus(submissionId);
            logger.debug('Submission status updated', { submissionId });
          } catch (error) {
            logger.error('Failed to update submission status', {
              submissionId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }

      // Summary
      if (totalStuckOutputs > 0) {
        logger.warn('Timeout monitor found stuck outputs', {
          totalStuckOutputs,
          affectedSubmissions: affectedSubmissionIds.size,
          action: 'Marked as FAILED and updated submission statuses',
        });
      } else {
        logger.info('Timeout monitor check complete - no stuck outputs found');
      }
    } catch (error) {
      logger.error('Timeout monitor check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Don't throw - we want the worker to continue running even if this check fails
    }
  }

  /**
   * Check AudioOutputs for timeout
   */
  private async checkAudioOutputs(threshold: Date, affectedSubmissionIds: Set<string>): Promise<number> {
    const stuckOutputs = await prisma.audioOutput.findMany({
      where: {
        status: 'PROCESSING',
        updatedAt: { lt: threshold },
      },
      include: {
        submission: {
          select: {
            id: true,
            articleId: true,
          },
        },
      },
    });

    if (stuckOutputs.length > 0) {
      logger.warn('Found stuck AudioOutputs', {
        count: stuckOutputs.length,
      });

      for (const output of stuckOutputs) {
        const minutesStuck = Math.floor((Date.now() - output.updatedAt.getTime()) / 1000 / 60);

        logger.warn('Marking stuck AudioOutput as FAILED', {
          outputId: output.id,
          submissionId: output.submissionId,
          minutesStuck,
        });

        await prisma.audioOutput.update({
          where: { id: output.id },
          data: {
            status: 'FAILED',
            error: `Timeout: Audio generation exceeded 30 minutes (stuck for ${minutesStuck} minutes). Job may have crashed or failed without proper error handling.`,
          },
        });

        affectedSubmissionIds.add(output.submissionId);
      }
    }

    return stuckOutputs.length;
  }

  /**
   * Check VideoOutputs for timeout
   */
  private async checkVideoOutputs(threshold: Date, affectedSubmissionIds: Set<string>): Promise<number> {
    const stuckOutputs = await prisma.videoOutput.findMany({
      where: {
        status: 'PROCESSING',
        updatedAt: { lt: threshold },
      },
      include: {
        submission: {
          select: {
            id: true,
            articleId: true,
          },
        },
      },
    });

    if (stuckOutputs.length > 0) {
      logger.warn('Found stuck VideoOutputs', {
        count: stuckOutputs.length,
      });

      for (const output of stuckOutputs) {
        const minutesStuck = Math.floor((Date.now() - output.updatedAt.getTime()) / 1000 / 60);
        const hasHeygenId = !!output.heygenVideoId;
        const hasSubmagicId = !!output.submagicProjectId;

        // Provide specific error message based on state
        let errorMessage = `Timeout: Video generation exceeded 30 minutes (stuck for ${minutesStuck} minutes). `;
        if (!hasHeygenId) {
          errorMessage += 'HeyGen video creation may have failed.';
        } else if (!hasSubmagicId) {
          errorMessage += 'HeyGen webhook may have never arrived.';
        } else {
          errorMessage += 'Submagic webhook may have never arrived or processing failed.';
        }

        logger.warn('Marking stuck VideoOutput as FAILED', {
          outputId: output.id,
          submissionId: output.submissionId,
          minutesStuck,
          heygenVideoId: hasHeygenId ? output.heygenVideoId : 'NOT SET',
          submagicProjectId: hasSubmagicId ? output.submagicProjectId : 'NOT SET',
        });

        await prisma.videoOutput.update({
          where: { id: output.id },
          data: {
            status: 'FAILED',
            error: errorMessage,
          },
        });

        affectedSubmissionIds.add(output.submissionId);
      }
    }

    return stuckOutputs.length;
  }

  /**
   * Check PodcastOutputs for timeout
   */
  private async checkPodcastOutputs(threshold: Date, affectedSubmissionIds: Set<string>): Promise<number> {
    const stuckOutputs = await prisma.podcastOutput.findMany({
      where: {
        status: 'PROCESSING',
        updatedAt: { lt: threshold },
      },
      include: {
        submission: {
          select: {
            id: true,
            articleId: true,
          },
        },
      },
    });

    if (stuckOutputs.length > 0) {
      logger.warn('Found stuck PodcastOutputs', {
        count: stuckOutputs.length,
      });

      for (const output of stuckOutputs) {
        const minutesStuck = Math.floor((Date.now() - output.updatedAt.getTime()) / 1000 / 60);

        logger.warn('Marking stuck PodcastOutput as FAILED', {
          outputId: output.id,
          submissionId: output.submissionId,
          minutesStuck,
        });

        await prisma.podcastOutput.update({
          where: { id: output.id },
          data: {
            status: 'FAILED',
            error: `Timeout: Podcast generation exceeded 30 minutes (stuck for ${minutesStuck} minutes). Job may have crashed or failed without proper error handling.`,
          },
        });

        affectedSubmissionIds.add(output.submissionId);
      }
    }

    return stuckOutputs.length;
  }

  /**
   * Check QuizOutputs for timeout
   */
  private async checkQuizOutputs(threshold: Date, affectedSubmissionIds: Set<string>): Promise<number> {
    const stuckOutputs = await prisma.quizOutput.findMany({
      where: {
        status: 'PROCESSING',
        updatedAt: { lt: threshold },
      },
      include: {
        submission: {
          select: {
            id: true,
            articleId: true,
          },
        },
      },
    });

    if (stuckOutputs.length > 0) {
      logger.warn('Found stuck QuizOutputs', {
        count: stuckOutputs.length,
      });

      for (const output of stuckOutputs) {
        const minutesStuck = Math.floor((Date.now() - output.updatedAt.getTime()) / 1000 / 60);

        logger.warn('Marking stuck QuizOutput as FAILED', {
          outputId: output.id,
          submissionId: output.submissionId,
          minutesStuck,
        });

        await prisma.quizOutput.update({
          where: { id: output.id },
          data: {
            status: 'FAILED',
            error: `Timeout: Quiz generation exceeded 30 minutes (stuck for ${minutesStuck} minutes). Job may have crashed or failed without proper error handling.`,
          },
        });

        affectedSubmissionIds.add(output.submissionId);
      }
    }

    return stuckOutputs.length;
  }

  /**
   * Check InteractivePodcastOutputs for timeout
   */
  private async checkInteractivePodcastOutputs(threshold: Date, affectedSubmissionIds: Set<string>): Promise<number> {
    const stuckOutputs = await prisma.interactivePodcastOutput.findMany({
      where: {
        status: 'PROCESSING',
        updatedAt: { lt: threshold },
      },
      include: {
        submission: {
          select: {
            id: true,
            articleId: true,
          },
        },
      },
    });

    if (stuckOutputs.length > 0) {
      logger.warn('Found stuck InteractivePodcastOutputs', {
        count: stuckOutputs.length,
      });

      for (const output of stuckOutputs) {
        const minutesStuck = Math.floor((Date.now() - output.updatedAt.getTime()) / 1000 / 60);

        logger.warn('Marking stuck InteractivePodcastOutput as FAILED', {
          outputId: output.id,
          submissionId: output.submissionId,
          minutesStuck,
        });

        await prisma.interactivePodcastOutput.update({
          where: { id: output.id },
          data: {
            status: 'FAILED',
            error: `Timeout: Interactive podcast generation exceeded 30 minutes (stuck for ${minutesStuck} minutes). Job may have crashed or failed without proper error handling.`,
          },
        });

        affectedSubmissionIds.add(output.submissionId);
      }
    }

    return stuckOutputs.length;
  }
}

// Singleton instance
export const timeoutMonitorService = new TimeoutMonitorService();
