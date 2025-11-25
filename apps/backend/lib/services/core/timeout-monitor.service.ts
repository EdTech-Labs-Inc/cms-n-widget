import { prisma } from '../../config/database';
import { submissionService } from '../submission.service';

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
    console.log('\n⏰ ========== TIMEOUT MONITOR CHECK ==========');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Checking for outputs stuck in PROCESSING > 30 minutes...`);

    const thresholdDate = new Date(Date.now() - this.TIMEOUT_THRESHOLD);
    console.log(`Threshold date: ${thresholdDate.toISOString()}`);

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
        console.log(`\n🔄 Updating ${affectedSubmissionIds.size} affected submission(s)...`);

        for (const submissionId of affectedSubmissionIds) {
          try {
            await submissionService.updateSubmissionStatus(submissionId);
            console.log(`  ✅ Updated submission ${submissionId}`);
          } catch (error) {
            console.error(`  ❌ Failed to update submission ${submissionId}:`, error instanceof Error ? error.message : 'Unknown error');
          }
        }
      }

      // Summary
      if (totalStuckOutputs > 0) {
        console.log(`\n📊 TIMEOUT MONITOR SUMMARY:`);
        console.log(`  - Total stuck outputs found: ${totalStuckOutputs}`);
        console.log(`  - Affected submissions: ${affectedSubmissionIds.size}`);
        console.log(`  - All marked as FAILED and submission statuses updated`);
      } else {
        console.log(`\n✅ No stuck outputs found - all systems healthy`);
      }

      console.log('================================================\n');
    } catch (error) {
      console.error('\n❌ TIMEOUT MONITOR ERROR:');
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        console.error(`Stack trace:\n${error.stack}`);
      }
      console.error('================================================\n');
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
      console.log(`\n🎵 Found ${stuckOutputs.length} stuck AudioOutput(s):`);

      for (const output of stuckOutputs) {
        const minutesStuck = Math.floor((Date.now() - output.updatedAt.getTime()) / 1000 / 60);
        console.log(`  - AudioOutput ${output.id} (stuck for ${minutesStuck} minutes)`);

        await prisma.audioOutput.update({
          where: { id: output.id },
          data: {
            status: 'FAILED',
            error: `Timeout: Audio generation exceeded 30 minutes (stuck for ${minutesStuck} minutes). Job may have crashed or failed without proper error handling.`,
          },
        });

        affectedSubmissionIds.add(output.submissionId);
        console.log(`    ✅ Marked as FAILED`);
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
      console.log(`\n🎬 Found ${stuckOutputs.length} stuck VideoOutput(s):`);

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

        console.log(`  - VideoOutput ${output.id} (stuck for ${minutesStuck} minutes)`);
        console.log(`    HeyGen ID: ${hasHeygenId ? output.heygenVideoId : 'NOT SET'}`);
        console.log(`    Submagic ID: ${hasSubmagicId ? output.submagicProjectId : 'NOT SET'}`);

        await prisma.videoOutput.update({
          where: { id: output.id },
          data: {
            status: 'FAILED',
            error: errorMessage,
          },
        });

        affectedSubmissionIds.add(output.submissionId);
        console.log(`    ✅ Marked as FAILED`);
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
      console.log(`\n🎙️ Found ${stuckOutputs.length} stuck PodcastOutput(s):`);

      for (const output of stuckOutputs) {
        const minutesStuck = Math.floor((Date.now() - output.updatedAt.getTime()) / 1000 / 60);
        console.log(`  - PodcastOutput ${output.id} (stuck for ${minutesStuck} minutes)`);

        await prisma.podcastOutput.update({
          where: { id: output.id },
          data: {
            status: 'FAILED',
            error: `Timeout: Podcast generation exceeded 30 minutes (stuck for ${minutesStuck} minutes). Job may have crashed or failed without proper error handling.`,
          },
        });

        affectedSubmissionIds.add(output.submissionId);
        console.log(`    ✅ Marked as FAILED`);
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
      console.log(`\n❓ Found ${stuckOutputs.length} stuck QuizOutput(s):`);

      for (const output of stuckOutputs) {
        const minutesStuck = Math.floor((Date.now() - output.updatedAt.getTime()) / 1000 / 60);
        console.log(`  - QuizOutput ${output.id} (stuck for ${minutesStuck} minutes)`);

        await prisma.quizOutput.update({
          where: { id: output.id },
          data: {
            status: 'FAILED',
            error: `Timeout: Quiz generation exceeded 30 minutes (stuck for ${minutesStuck} minutes). Job may have crashed or failed without proper error handling.`,
          },
        });

        affectedSubmissionIds.add(output.submissionId);
        console.log(`    ✅ Marked as FAILED`);
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
      console.log(`\n🎮 Found ${stuckOutputs.length} stuck InteractivePodcastOutput(s):`);

      for (const output of stuckOutputs) {
        const minutesStuck = Math.floor((Date.now() - output.updatedAt.getTime()) / 1000 / 60);
        console.log(`  - InteractivePodcastOutput ${output.id} (stuck for ${minutesStuck} minutes)`);

        await prisma.interactivePodcastOutput.update({
          where: { id: output.id },
          data: {
            status: 'FAILED',
            error: `Timeout: Interactive podcast generation exceeded 30 minutes (stuck for ${minutesStuck} minutes). Job may have crashed or failed without proper error handling.`,
          },
        });

        affectedSubmissionIds.add(output.submissionId);
        console.log(`    ✅ Marked as FAILED`);
      }
    }

    return stuckOutputs.length;
  }
}

// Singleton instance
export const timeoutMonitorService = new TimeoutMonitorService();
