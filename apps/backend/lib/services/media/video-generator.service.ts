import { agentaOpenAIService } from '../external/agenta-openai.service';
import { heygenService } from '../external/heygen.service';
import { prisma } from '../../config/database';
import { VideoScriptsSchema } from '@repo/types';
import { logger } from '@repo/logging';

/**
 * Video Generator Service - Generate videos from articles
 *
 * Workflow (Webhook-based):
 * 1. Generate 1-3 video scripts from article (OpenAI)
 * 2. For each script:
 *    - Create HeyGen video (non-blocking)
 *    - Store video ID and script in pending state
 * 3. HeyGen webhook notifies when video is ready (handled by video-webhook.service.ts)
 */
export class VideoGeneratorService {
  /**
   * Generate videos with bubbles for an article
   * Creates HeyGen videos but doesn't wait for completion (webhook-based)
   * Now creates one VideoOutput record per video (not a JSON array)
   */
  async generateVideos(articleId: string, language: string = 'ENGLISH', organizationId?: string): Promise<void> {
    try {
      // Get article and submission
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: {
          submissions: {
            where: {
              language: language as any,
              articleId: articleId
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
      });

      if (!article) {
        throw new Error('Article not found');
      }

      const submission = article.submissions[0];
      if (!submission) {
        throw new Error('Submission not found');
      }

      // Use organizationId from parameter or article
      const orgId = organizationId || article.organizationId;

      const languageToUse = submission.language || language;
      logger.info('Generating videos for article', {
        articleTitle: article.title,
        language: languageToUse
      });

      // Step 1: Generate video scripts (1-3 videos)
      const { videos: scriptList } = await this.generateVideoScripts(article.title, article.content, languageToUse);

      logger.info('Generated video scripts', { scriptCount: scriptList.length });


      // Step 2: Create VideoOutput for each script and initiate HeyGen videos
      let processedCount = 0;

      for (const scriptData of scriptList.slice(0, 1)) {
        const { title, script } = scriptData;

        // Check if VideoOutput already exists (created by submission.service with customization)
        let videoOutput = await prisma.videoOutput.findFirst({
          where: {
            submissionId: submission.id,
            status: 'PENDING',
          },
        });

        if (videoOutput) {
          // Update existing VideoOutput with title and script
          logger.info('Using existing VideoOutput with customization settings', {
            videoOutputId: videoOutput.id
          });
          videoOutput = await prisma.videoOutput.update({
            where: { id: videoOutput.id },
            data: {
              status: 'PROCESSING',
              title,
              script,
            },
          });
        } else {
          // Create VideoOutput record in PROCESSING state (fallback for legacy flow)
          logger.info('Creating new VideoOutput without customization');
          videoOutput = await prisma.videoOutput.create({
            data: {
              submissionId: submission.id,
              status: 'PROCESSING',
              title,
              script,
            },
          });
        }

        // Initiate HeyGen video creation (non-blocking)
        // Use character configuration from VideoOutput if set, otherwise use defaults
        // Fetch avatar details to get correct voice if not already set
        let voiceId = videoOutput.heygenVoiceId || undefined;

        // DEBUG: Log the initial state before voice lookup
        logger.info('🔍 DEBUG: Voice lookup initial state', {
          videoOutputId: videoOutput.id,
          heygenVoiceId_raw: videoOutput.heygenVoiceId,
          heygenVoiceId_afterCoercion: voiceId,
          heygenCharacterId: videoOutput.heygenCharacterId,
          heygenCharacterType: videoOutput.heygenCharacterType,
          willFetchDetails: !voiceId && videoOutput.heygenCharacterId && videoOutput.heygenCharacterType === 'avatar',
        });

        if (!voiceId && videoOutput.heygenCharacterId && videoOutput.heygenCharacterType === 'avatar') {
          try {
            logger.info('Fetching avatar details for voice ID', {
              avatarId: videoOutput.heygenCharacterId
            });
            const avatarDetails = await heygenService.getAvatarDetails(videoOutput.heygenCharacterId);

            // DEBUG: Log the full response from getAvatarDetails
            logger.info('🔍 DEBUG: Full avatar details response', {
              avatarId: videoOutput.heygenCharacterId,
              fullResponse: JSON.stringify(avatarDetails, null, 2),
              hasData: !!avatarDetails.data,
              // HeyGen returns default_voice_id as a flat string, not nested object
              defaultVoiceId: (avatarDetails.data as any)?.default_voice_id,
            });

            // HeyGen API returns default_voice_id as a flat string field
            const fetchedVoiceId = (avatarDetails.data as any)?.default_voice_id;
            if (fetchedVoiceId) {
              voiceId = fetchedVoiceId;
              logger.info('Got voice ID from avatar details', { voiceId });

              // Update the VideoOutput with the fetched voice ID for future reference
              await prisma.videoOutput.update({
                where: { id: videoOutput.id },
                data: { heygenVoiceId: voiceId },
              });
            } else {
              logger.warn('🔍 DEBUG: No default_voice.voice_id found in avatar details');
            }
          } catch (error) {
            logger.warn('Failed to fetch avatar details for voice, will use defaults', {
              avatarId: videoOutput.heygenCharacterId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        } else if (!voiceId) {
          logger.info('🔍 DEBUG: Voice lookup skipped - conditions not met', {
            reason: !videoOutput.heygenCharacterId ? 'No characterId' :
                    videoOutput.heygenCharacterType !== 'avatar' ? `CharacterType is ${videoOutput.heygenCharacterType}, not avatar` :
                    'Unknown reason',
          });
        }

        // DEBUG: Log final voiceId before sending to HeyGen
        logger.info('🔍 DEBUG: Final voiceId before HeyGen call', {
          voiceId: voiceId ?? '(undefined - will use default)',
        });

        logger.info('Calling HeyGen with VideoOutput settings', {
          videoOutputId: videoOutput.id,
          heygenCharacterType: videoOutput.heygenCharacterType ?? 'not set (will use defaults)',
          heygenCharacterId: videoOutput.heygenCharacterId ?? 'not set (will use defaults)',
          heygenVoiceId: voiceId ?? 'not set (will use defaults)',
          scriptLength: script.length,
          title,
        });
        const { videoId } = await heygenService.generateVideo({
          script,
          title,
          characterType: videoOutput.heygenCharacterType as 'talking_photo' | 'avatar' | undefined,
          characterId: videoOutput.heygenCharacterId || undefined,
          voiceId,
        });

        logger.info('HeyGen video initiated', {
          videoId,
          title,
          videoOutputId: videoOutput.id
        });

        // Update VideoOutput with HeyGen video ID
        await prisma.videoOutput.update({
          where: { id: videoOutput.id },
          data: {
            heygenVideoId: videoId,
          },
        });

        processedCount++;
      }

      logger.info('Initiated HeyGen videos', {
        processedCount,
        totalScripts: scriptList.length
      });
    } catch (error) {
      logger.error('Video Generation Error', {
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Generate video scripts from article using Agenta prompts
   */
  private async generateVideoScripts(title: string, content: string, language: string = 'ENGLISH') {
    const languageMap: Record<string, string> = {
      ENGLISH: 'English',
      MARATHI: 'Marathi',
      HINDI: 'Hindi',
      BENGALI: 'Bengali',
    };
    const languageName = languageMap[language] || 'English';

    return await agentaOpenAIService.generateStructured({
      promptSlug: 'generate_video_scripts_prompt',
      variables: {
        articleTitle: title,
        articleContent: content,
        languageName,
      },
      schema: VideoScriptsSchema,
      schemaName: 'VideoScripts',
      temperature: 0.7,
    });
  }

  /**
   * Regenerate video with edited script
   * Initiates a new HeyGen video generation with the updated script
   */
  async regenerateVideo(videoOutputId: string): Promise<void> {
    try {
      logger.info('Regenerating video', { videoOutputId });

      // Get the video output with its script and customization settings
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
        throw new Error('No script available for regeneration');
      }

      logger.info('Using edited script for regeneration', {
        scriptLength: videoOutput.script.length
      });

      // Update status to PROCESSING
      await prisma.videoOutput.update({
        where: { id: videoOutputId },
        data: {
          status: 'PROCESSING',
          error: null, // Clear any previous errors
        },
      });

      // Initiate HeyGen video creation with the edited script
      // Use existing character configuration if set
      // Fetch avatar details to get correct voice if not already set
      let voiceId = videoOutput.heygenVoiceId || undefined;

      if (!voiceId && videoOutput.heygenCharacterId && videoOutput.heygenCharacterType === 'avatar') {
        try {
          logger.info('Regenerate: Fetching avatar details for voice ID', {
            avatarId: videoOutput.heygenCharacterId
          });
          const avatarDetails = await heygenService.getAvatarDetails(videoOutput.heygenCharacterId);
          // HeyGen API returns default_voice_id as a flat string field
          const fetchedVoiceId = (avatarDetails.data as any)?.default_voice_id;
          if (fetchedVoiceId) {
            voiceId = fetchedVoiceId;
            logger.info('Regenerate: Got voice ID from avatar details', { voiceId });

            // Update the VideoOutput with the fetched voice ID for future reference
            await prisma.videoOutput.update({
              where: { id: videoOutput.id },
              data: { heygenVoiceId: voiceId },
            });
          }
        } catch (error) {
          logger.warn('Regenerate: Failed to fetch avatar details for voice, will use defaults', {
            avatarId: videoOutput.heygenCharacterId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      logger.info('Regenerate: Calling HeyGen with VideoOutput settings', {
        videoOutputId: videoOutput.id,
        heygenCharacterType: videoOutput.heygenCharacterType ?? 'not set (will use defaults)',
        heygenCharacterId: videoOutput.heygenCharacterId ?? 'not set (will use defaults)',
        heygenVoiceId: voiceId ?? 'not set (will use defaults)',
        scriptLength: videoOutput.script.length,
        title: videoOutput.title || videoOutput.submission.article.title,
      });
      const { videoId } = await heygenService.generateVideo({
        script: videoOutput.script,
        title: videoOutput.title || videoOutput.submission.article.title,
        characterType: videoOutput.heygenCharacterType as 'talking_photo' | 'avatar' | undefined,
        characterId: videoOutput.heygenCharacterId || undefined,
        voiceId,
      });

      logger.info('HeyGen video initiated for regeneration', {
        videoId,
        videoOutputId
      });

      // Update VideoOutput with new HeyGen video ID
      await prisma.videoOutput.update({
        where: { id: videoOutputId },
        data: {
          heygenVideoId: videoId,
        },
      });

      logger.info('Video regeneration initiated, awaiting webhook callback');
    } catch (error) {
      logger.error('Video Regeneration Error', {
        error: error instanceof Error ? error.message : error
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
export const videoGeneratorService = new VideoGeneratorService();
