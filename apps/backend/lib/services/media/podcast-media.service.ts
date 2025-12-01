import { elevenlabsService } from '../external/elevenlabs.service';
import { storageService } from '../core/storage.service';
import { aiTaggingService } from '../ai-tagging.service';
import { thumbnailService } from './thumbnail.service';
import { prisma } from '../../config/database';
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { logger } from '@repo/logging';

/**
 * Podcast Media Service - Generate audio from approved transcript
 *
 * This is part of the decoupled generation flow where:
 * 1. Transcript was generated first (by podcast-script.service.ts)
 * 2. User reviewed and edited the transcript
 * 3. User optionally selected voices
 * 4. This service generates the actual audio with ElevenLabs
 */
export class PodcastMediaService {
  /**
   * Generate podcast audio from an approved transcript
   * Called after user triggers "Generate Podcast" on the edit page
   *
   * @param podcastOutputId - The PodcastOutput ID (must have transcript set)
   * @param voiceSelection - Optional voice overrides
   */
  async generatePodcastFromTranscript(
    podcastOutputId: string,
    voiceSelection?: {
      interviewerVoiceId?: string;
      guestVoiceId?: string;
    }
  ): Promise<void> {
    try {
      logger.info('Generating podcast from approved transcript', { podcastOutputId });

      // Get the podcast output with its transcript
      const podcastOutput = await prisma.podcastOutput.findUnique({
        where: { id: podcastOutputId },
        include: {
          submission: {
            include: {
              article: true,
            },
          },
        },
      });

      if (!podcastOutput) {
        throw new Error('Podcast output not found');
      }

      if (!podcastOutput.transcript) {
        throw new Error('No transcript available - transcript generation may have failed');
      }

      // Update status to PROCESSING
      await prisma.podcastOutput.update({
        where: { id: podcastOutputId },
        data: {
          status: 'PROCESSING',
          error: null,
        },
      });

      const article = podcastOutput.submission.article;
      const orgId = article.organizationId;

      // Parse the transcript
      const segments = JSON.parse(podcastOutput.transcript) as Array<{
        speaker: 'interviewer' | 'guest';
        text: string;
      }>;

      logger.info('Parsed transcript segments', { segmentCount: segments.length });

      // Generate thumbnail if not already present
      let thumbnailUrl = podcastOutput.thumbnailUrl;
      if (!thumbnailUrl && podcastOutput.title) {
        try {
          thumbnailUrl = await thumbnailService.generateThumbnail(
            podcastOutput.title,
            'podcast',
            podcastOutputId,
            orgId
          );
          logger.info('Generated podcast thumbnail', { thumbnailUrl });
        } catch (error) {
          logger.warn('Failed to generate podcast thumbnail', {
            error: error instanceof Error ? error.message : error,
          });
        }
      }

      // Generate audio for each segment with different voices
      const audioSegments = await this.generateSegmentAudio(
        segments,
        podcastOutput.submissionId,
        voiceSelection
      );

      // Stitch audio segments together with FFmpeg
      const { finalAudioBuffer, totalDuration } = await this.stitchAudioSegments(audioSegments);

      // Upload final podcast to storage
      const uploadResult = await storageService.uploadAudio(
        finalAudioBuffer,
        podcastOutput.submissionId,
        'podcast.mp3',
        orgId
      );

      // Calculate segment timings
      const timedSegments = this.calculateSegmentTimings(audioSegments);

      // Save to database
      await prisma.podcastOutput.update({
        where: { id: podcastOutputId },
        data: {
          thumbnailUrl,
          audioFileUrl: uploadResult.cloudfrontUrl,
          segments: timedSegments,
          duration: Math.ceil(totalDuration),
          status: 'COMPLETED',
        },
      });

      logger.info('Podcast generated successfully from transcript', { podcastOutputId });

      // Auto-tag the podcast output (only for English)
      await aiTaggingService.tagPodcastOutput(podcastOutputId);
    } catch (error) {
      logger.error('Podcast Media Generation Error', {
        error: error instanceof Error ? error.message : error,
        podcastOutputId,
      });

      await prisma.podcastOutput.update({
        where: { id: podcastOutputId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Generate audio for each podcast segment with different voices
   */
  private async generateSegmentAudio(
    segments: Array<{ speaker: 'interviewer' | 'guest'; text: string }>,
    submissionId: string,
    voiceSelection?: {
      interviewerVoiceId?: string;
      guestVoiceId?: string;
    }
  ) {
    const interviewerVoice = voiceSelection?.interviewerVoiceId || elevenlabsService.getInterviewerVoiceId();
    const guestVoice = voiceSelection?.guestVoiceId || elevenlabsService.getGuestVoiceId();

    logger.info('Generating audio for podcast segments', {
      segmentCount: segments.length,
      interviewerVoice,
      guestVoice,
    });

    const audioSegments = [];

    // Generate segments sequentially to avoid ElevenLabs rate limits
    for (let index = 0; index < segments.length; index++) {
      const segment = segments[index];
      const voiceId = segment.speaker === 'interviewer' ? interviewerVoice : guestVoice;

      logger.info('Generating segment audio', {
        segmentIndex: index + 1,
        totalSegments: segments.length,
        speaker: segment.speaker,
      });

      // Generate audio
      const audioBuffer = await elevenlabsService.textToSpeech({
        text: segment.text,
        voiceId,
      });

      // Save to temp file for FFmpeg processing
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `podcast_segment_${submissionId}_${index}.mp3`);
      await fs.writeFile(tempFile, audioBuffer);

      // Get audio duration
      const duration = await this.getAudioDuration(tempFile);

      audioSegments.push({
        speaker: segment.speaker,
        text: segment.text,
        tempFile,
        duration,
      });
    }

    logger.info('Generated audio segments', { count: audioSegments.length });
    return audioSegments;
  }

  /**
   * Stitch audio segments together using FFmpeg
   */
  private async stitchAudioSegments(
    segments: Array<{ tempFile: string; duration: number }>
  ): Promise<{ finalAudioBuffer: Buffer; totalDuration: number }> {
    return new Promise((resolve, reject) => {
      const processStitching = async () => {
        try {
          logger.info('Stitching audio segments', { segmentCount: segments.length });

          const tempDir = os.tmpdir();
          const outputFile = path.join(tempDir, `podcast_final_${Date.now()}.mp3`);

          // Create FFmpeg command
          let command = ffmpeg();

          // Add all input files
          segments.forEach((segment) => {
            command = command.input(segment.tempFile);
          });

          // Concatenate and output
          command
            .on('end', async () => {
              try {
                // Read final file
                const finalAudioBuffer = await fs.readFile(outputFile);

                // Calculate total duration
                const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);

                // Cleanup temp files
                await Promise.all([
                  ...segments.map((seg) => fs.unlink(seg.tempFile).catch(() => {})),
                  fs.unlink(outputFile).catch(() => {}),
                ]);

                resolve({ finalAudioBuffer, totalDuration });
              } catch (error) {
                reject(error);
              }
            })
            .on('error', (error) => {
              reject(new Error(`FFmpeg error: ${error.message}`));
            })
            .mergeToFile(outputFile, tempDir);
        } catch (error) {
          reject(error);
        }
      };

      processStitching();
    });
  }

  /**
   * Get audio duration from file using FFmpeg
   */
  private getAudioDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const duration = metadata.format.duration || 0;
          resolve(duration);
        }
      });
    });
  }

  /**
   * Calculate segment timings based on durations
   */
  private calculateSegmentTimings(
    segments: Array<{ speaker: 'interviewer' | 'guest'; text: string; duration: number }>
  ) {
    let currentTime = 0;
    return segments.map((segment) => {
      const startTime = currentTime;
      const endTime = currentTime + segment.duration;
      currentTime = endTime;

      return {
        speaker: segment.speaker,
        text: segment.text,
        startTime: Math.floor(startTime),
        endTime: Math.floor(endTime),
      };
    });
  }
}

// Singleton instance
export const podcastMediaService = new PodcastMediaService();
