import { agentaOpenAIService } from '../external/agenta-openai.service';
import { heygenService } from '../external/heygen.service';
import { prisma } from '../../config/database';
import { VideoScriptsSchema } from '@repo/types';
import { logger } from '@repo/logging';
import { getMaxVideosPerSubmission, getVideoCountForPrompt } from '@repo/config/limits';

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

      // Apply environment-based limit (dev = 1, prod = unlimited)
      const maxVideos = getMaxVideosPerSubmission();
      const scriptsToProcess = maxVideos ? scriptList.slice(0, maxVideos) : scriptList;

      logger.info('Generated video scripts', {
        scriptCount: scriptList.length,
        maxVideos: maxVideos ?? 'unlimited',
        scriptsToProcess: scriptsToProcess.length
      });

      // Step 2: Create VideoOutput for each script and initiate HeyGen videos
      let processedCount = 0;

      for (const scriptData of scriptsToProcess) {
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

        // Initiate HeyGen Avatar IV video creation (non-blocking)
        // Look up Character to get imageKey and voiceId
        const characterId = videoOutput.characterId;

        if (!characterId) {
          throw new Error('No character ID configured for video generation');
        }

        const character = await prisma.character.findUnique({
          where: { id: characterId },
          include: { voice: true },
        });

        if (!character) {
          throw new Error(`Character not found: ${characterId}`);
        }

        // Get voice ID from Character's linked voice
        const voiceId = character.voice.elevenlabsVoiceId;

        if (!voiceId) {
          throw new Error(`No voice ID found for character ${character.name}`);
        }

        logger.info('Calling HeyGen Avatar IV API', {
          videoOutputId: videoOutput.id,
          characterName: character.name,
          imageKey: character.heygenImageKey,
          voiceId,
          scriptLength: script.length,
          title,
        });

        const { videoId } = await heygenService.generateVideo({
          imageKey: character.heygenImageKey,
          script,
          voiceId,
          title,
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
   * Uses environment-based videoCount to save API credits in dev
   */
  private async generateVideoScripts(title: string, content: string, language: string = 'ENGLISH') {
    const languageMap: Record<string, string> = {
      ENGLISH: 'English',
      MARATHI: 'Marathi',
      HINDI: 'Hindi',
      BENGALI: 'Bengali',
      GUJARATI: 'Gujarati',
    };
    const languageName = languageMap[language] || 'English';
    const videoCount = getVideoCountForPrompt();

    logger.info('Requesting video scripts from AI', {
      videoCount,
      language: languageName
    });

    return await agentaOpenAIService.generateStructured({
      promptSlug: 'generate_video_scripts_prompt',
      variables: {
        articleTitle: title,
        articleContent: content,
        languageName,
        videoCount,
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

      // Initiate HeyGen Avatar IV video creation with the edited script
      // Look up Character to get imageKey and voiceId
      const characterId = videoOutput.characterId;

      if (!characterId) {
        throw new Error('No character ID configured for video regeneration');
      }

      const character = await prisma.character.findUnique({
        where: { id: characterId },
        include: { voice: true },
      });

      if (!character) {
        throw new Error(`Character not found: ${characterId}`);
      }

      // Get voice ID from Character's linked voice
      const voiceId = character.voice.elevenlabsVoiceId;

      if (!voiceId) {
        throw new Error(`No voice ID found for character ${character.name}`);
      }

      logger.info('Regenerate: Calling HeyGen Avatar IV API', {
        videoOutputId: videoOutput.id,
        characterName: character.name,
        imageKey: character.heygenImageKey,
        voiceId,
        scriptLength: videoOutput.script.length,
        title: videoOutput.title || videoOutput.submission.article.title,
      });

      const { videoId } = await heygenService.generateVideo({
        imageKey: character.heygenImageKey,
        script: videoOutput.script,
        voiceId,
        title: videoOutput.title || videoOutput.submission.article.title,
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
