import { heygenService } from '../external/heygen.service';
import { elevenlabsService } from '../external/elevenlabs.service';
import { storageService } from '../core/storage.service';
import { prisma } from '../../config/database';
import { logger } from '@repo/logging';

/**
 * Standalone Video Service - Generate video from standalone video create page
 *
 * This service handles video generation for the standalone video flow (no Article/Submission):
 * 1. Generate audio with ElevenLabs
 * 2. Upload audio to S3
 * 3. Generate video with HeyGen (using audio URL for lip-sync)
 * 4. HeyGen webhook will handle completion and Submagic processing
 */
export class StandaloneVideoService {
  /**
   * Generate video from standalone video record
   * @param standaloneVideoId - The StandaloneVideo ID
   */
  async generateVideo(standaloneVideoId: string): Promise<void> {
    try {
      logger.info('Generating standalone video', { standaloneVideoId });

      // Get the standalone video with all related data
      const standaloneVideo = await prisma.standaloneVideo.findUnique({
        where: { id: standaloneVideoId },
        include: {
          captionStyle: true,
          backgroundMusic: true,
          startBumper: true,
          endBumper: true,
        },
      });

      if (!standaloneVideo) {
        throw new Error('Standalone video not found');
      }

      if (!standaloneVideo.script) {
        throw new Error('No script available');
      }

      // Update status to PROCESSING
      await prisma.standaloneVideo.update({
        where: { id: standaloneVideoId },
        data: {
          status: 'PROCESSING',
          error: null,
        },
      });

      // Step 1: Generate audio with ElevenLabs
      logger.info('Generating audio with ElevenLabs', {
        standaloneVideoId,
        scriptLength: standaloneVideo.script.length,
        voiceId: standaloneVideo.voiceId,
      });

      const audioBuffer = await elevenlabsService.textToSpeech({
        text: standaloneVideo.script,
        voiceId: standaloneVideo.voiceId,
      });

      logger.info('ElevenLabs audio generated', {
        standaloneVideoId,
        audioSize: audioBuffer.length,
      });

      // Step 2: Upload audio to S3 for public access
      const audioResult = await storageService.uploadAudio(
        audioBuffer,
        standaloneVideoId, // Use standalone video ID as folder
        'standalone-video-voiceover.mp3',
        standaloneVideo.organizationId
      );

      logger.info('Audio uploaded to S3', {
        standaloneVideoId,
        cloudfrontUrl: audioResult.cloudfrontUrl,
      });

      // Store the ElevenLabs audio URL
      await prisma.standaloneVideo.update({
        where: { id: standaloneVideoId },
        data: {
          elevenlabsAudioUrl: audioResult.cloudfrontUrl,
        },
      });

      // Step 3: Generate title from first line of script if not set
      const title = standaloneVideo.title || standaloneVideo.script.split('\n')[0].slice(0, 100);

      // Step 4: Call HeyGen with audio URL (lip-sync mode)
      logger.info('Calling HeyGen to generate video with audio URL', {
        standaloneVideoId,
        characterType: standaloneVideo.heygenCharacterType,
        characterId: standaloneVideo.heygenAvatarId,
        audioUrl: audioResult.cloudfrontUrl,
        title,
      });

      const { videoId } = await heygenService.generateVideo({
        audioUrl: audioResult.cloudfrontUrl,
        title,
        characterType: standaloneVideo.heygenCharacterType as 'talking_photo' | 'avatar',
        characterId: standaloneVideo.heygenAvatarId,
      });

      logger.info('HeyGen video initiated', {
        heygenVideoId: videoId,
        standaloneVideoId,
      });

      // Update StandaloneVideo with HeyGen video ID
      await prisma.standaloneVideo.update({
        where: { id: standaloneVideoId },
        data: {
          heygenVideoId: videoId,
        },
      });

      logger.info('Standalone video generation initiated, awaiting HeyGen webhook callback', {
        standaloneVideoId,
        heygenVideoId: videoId,
      });
    } catch (error) {
      logger.error('Standalone Video Generation Error', {
        error: error instanceof Error ? error.message : error,
        standaloneVideoId,
      });

      // Mark as failed
      await prisma.standaloneVideo.update({
        where: { id: standaloneVideoId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }
}

// Singleton instance
export const standaloneVideoService = new StandaloneVideoService();
