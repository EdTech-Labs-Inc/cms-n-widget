import { heygenService } from '../external/heygen.service';
import { elevenlabsService } from '../external/elevenlabs.service';
import { storageService } from '../core/storage.service';
import { prisma } from '../../config/database';
import { logger } from '@repo/logging';

/**
 * Video Media Service - Generate HeyGen video from approved script
 *
 * This is part of the decoupled generation flow where:
 * 1. Script was generated first (by video-script.service.ts)
 * 2. User reviewed and edited the script
 * 3. User configured video settings (character, voice, captions)
 * 4. This service generates audio with ElevenLabs (v3 model)
 * 5. Audio is uploaded to S3 for public access
 * 6. HeyGen generates video with lip-sync to the audio
 */
export class VideoMediaService {
  /**
   * Generate video from an approved script with customization settings
   * Called after user triggers "Generate Video" on the edit page
   *
   * @param videoOutputId - The VideoOutput ID (must have script and customization set)
   * @param videoCustomization - Optional customization overrides from the API call
   */
  async generateVideoFromScript(
    videoOutputId: string,
    videoCustomization?: {
      characterId: string;
      characterType: 'avatar' | 'talking_photo';
      voiceId?: string;
      enableCaptions?: boolean;
      captionTemplate?: string;
      enableMagicZooms?: boolean;
      enableMagicBrolls?: boolean;
      magicBrollsPercentage?: number;
    }
  ): Promise<void> {
    try {
      logger.info('Generating video from approved script', { videoOutputId });

      // Get the video output with its script and organization info
      const videoOutput = await prisma.videoOutput.findUnique({
        where: { id: videoOutputId },
        include: {
          submission: {
            include: {
              article: {
                select: {
                  id: true,
                  title: true,
                  organizationId: true,
                },
              },
            },
          },
        },
      });

      if (!videoOutput) {
        throw new Error('Video output not found');
      }

      if (!videoOutput.script) {
        throw new Error('No script available - script generation may have failed');
      }

      // Validate customization is set (either from DB or provided)
      const characterId = videoCustomization?.characterId || videoOutput.heygenCharacterId;
      const characterType = videoCustomization?.characterType || videoOutput.heygenCharacterType;

      if (!characterId || !characterType) {
        throw new Error('Video customization (character) must be configured before generating video');
      }

      // Update customization settings if provided
      if (videoCustomization) {
        await prisma.videoOutput.update({
          where: { id: videoOutputId },
          data: {
            heygenCharacterId: videoCustomization.characterId,
            heygenCharacterType: videoCustomization.characterType,
            heygenVoiceId: videoCustomization.voiceId || null,
            enableCaptions: videoCustomization.enableCaptions ?? true,
            submagicTemplate: videoCustomization.captionTemplate || null,
            enableMagicZooms: videoCustomization.enableMagicZooms ?? true,
            enableMagicBrolls: videoCustomization.enableMagicBrolls ?? true,
            magicBrollsPercentage: videoCustomization.magicBrollsPercentage ?? 40,
          },
        });
      }

      // Update status to PROCESSING
      await prisma.videoOutput.update({
        where: { id: videoOutputId },
        data: {
          status: 'PROCESSING',
          error: null,
        },
      });

      // Get voice ID - from customization or DB (ElevenLabs voice ID from Character's linked Voice)
      const voiceId = videoCustomization?.voiceId || videoOutput.heygenVoiceId;

      if (!voiceId) {
        throw new Error('Voice ID is required - character must have a linked voice');
      }

      // Step 1: Generate audio with ElevenLabs (using v3 model)
      logger.info('Generating audio with ElevenLabs', {
        videoOutputId,
        scriptLength: videoOutput.script.length,
        voiceId,
      });

      const audioBuffer = await elevenlabsService.textToSpeech({
        text: videoOutput.script,
        voiceId,
      });

      logger.info('ElevenLabs audio generated', {
        videoOutputId,
        audioSize: audioBuffer.length,
      });

      // Step 2: Upload audio to S3 for public access
      const organizationId = videoOutput.submission.article.organizationId;
      const audioResult = await storageService.uploadAudio(
        audioBuffer,
        videoOutput.submissionId,
        'video-voiceover.mp3',
        organizationId
      );

      logger.info('Audio uploaded to S3', {
        videoOutputId,
        cloudfrontUrl: audioResult.cloudfrontUrl,
      });

      // Store the ElevenLabs audio URL
      await prisma.videoOutput.update({
        where: { id: videoOutputId },
        data: {
          elevenlabsAudioUrl: audioResult.cloudfrontUrl,
        },
      });

      // Step 3: Call HeyGen with audio URL (lip-sync mode)
      logger.info('Calling HeyGen to generate video with audio URL', {
        videoOutputId,
        characterType,
        characterId,
        audioUrl: audioResult.cloudfrontUrl,
        title: videoOutput.title,
      });

      const { videoId } = await heygenService.generateVideo({
        audioUrl: audioResult.cloudfrontUrl,
        title: videoOutput.title || videoOutput.submission.article.title,
        characterType: characterType as 'talking_photo' | 'avatar',
        characterId,
      });

      logger.info('HeyGen video initiated', {
        videoId,
        videoOutputId,
      });

      // Update VideoOutput with HeyGen video ID
      await prisma.videoOutput.update({
        where: { id: videoOutputId },
        data: {
          heygenVideoId: videoId,
        },
      });

      logger.info('Video generation initiated, awaiting HeyGen webhook callback');
    } catch (error) {
      logger.error('Video Media Generation Error', {
        error: error instanceof Error ? error.message : error,
        videoOutputId,
      });

      // Mark as failed
      await prisma.videoOutput.update({
        where: { id: videoOutputId },
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
export const videoMediaService = new VideoMediaService();
