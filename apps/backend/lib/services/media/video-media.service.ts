import { heygenService } from '../external/heygen.service';
import { prisma } from '../../config/database';
import { logger } from '@repo/logging';

/**
 * Video Media Service - Generate HeyGen video from approved script
 *
 * This is part of the decoupled generation flow where:
 * 1. Script was generated first (by video-script.service.ts)
 * 2. User reviewed and edited the script
 * 3. User configured video settings (character, voice, captions)
 * 4. This service generates the actual video with HeyGen
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

      // Get the video output with its script
      const videoOutput = await prisma.videoOutput.findUnique({
        where: { id: videoOutputId },
        include: {
          submission: {
            include: {
              article: true,
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

      // Get voice ID - either from customization, DB, or fetch from avatar
      let voiceId = videoCustomization?.voiceId || videoOutput.heygenVoiceId || undefined;

      if (!voiceId && characterType === 'avatar') {
        try {
          logger.info('Fetching avatar details for voice ID', { avatarId: characterId });
          const avatarDetails = await heygenService.getAvatarDetails(characterId);
          const fetchedVoiceId = (avatarDetails.data as any)?.default_voice_id;
          if (fetchedVoiceId) {
            voiceId = fetchedVoiceId;
            logger.info('Got voice ID from avatar details', { voiceId });

            // Store the fetched voice ID
            await prisma.videoOutput.update({
              where: { id: videoOutputId },
              data: { heygenVoiceId: voiceId },
            });
          }
        } catch (error) {
          logger.warn('Failed to fetch avatar details for voice, will use defaults', {
            avatarId: characterId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      logger.info('Calling HeyGen to generate video', {
        videoOutputId,
        characterType,
        characterId,
        voiceId: voiceId ?? '(using defaults)',
        scriptLength: videoOutput.script.length,
        title: videoOutput.title,
      });

      // Call HeyGen to generate video
      const { videoId } = await heygenService.generateVideo({
        script: videoOutput.script,
        title: videoOutput.title || videoOutput.submission.article.title,
        characterType: characterType as 'talking_photo' | 'avatar',
        characterId,
        voiceId,
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
