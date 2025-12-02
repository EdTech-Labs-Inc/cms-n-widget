import { agentaOpenAIService } from '../external/agenta-openai.service';
import { prisma } from '../../config/database';
import { VideoScriptsSchema } from '@repo/types';
import { logger } from '@repo/logging';

/**
 * Video Script Service - Generate video scripts only (no HeyGen)
 *
 * This is part of the decoupled generation flow where:
 * 1. Script is generated first and enters SCRIPT_READY state
 * 2. User can review and edit the script
 * 3. Once approved, video-media.service generates the actual video
 */
export class VideoScriptService {
  /**
   * Generate video script for an article
   * Sets status to SCRIPT_READY after successful generation
   */
  async generateVideoScript(
    articleId: string,
    outputId: string,
    language: string = 'ENGLISH',
    organizationId: string
  ): Promise<void> {
    try {
      // Get article
      const article = await prisma.article.findUnique({
        where: { id: articleId },
      });

      if (!article) {
        throw new Error('Article not found');
      }

      // Update status to PROCESSING
      await prisma.videoOutput.update({
        where: { id: outputId },
        data: { status: 'PROCESSING' },
      });

      logger.info('Generating video script for article', {
        articleTitle: article.title,
        language,
        outputId,
      });

      // Generate video scripts using OpenAI
      const { videos: scriptList } = await this.generateVideoScripts(
        article.title,
        article.content,
        language
      );

      if (!scriptList || scriptList.length === 0) {
        throw new Error('Failed to generate video scripts');
      }

      // Take the first script
      const { title, script } = scriptList[0];

      logger.info('Generated video script', {
        outputId,
        title,
        scriptLength: script.length,
      });

      // Update VideoOutput with script and set status to SCRIPT_READY
      await prisma.videoOutput.update({
        where: { id: outputId },
        data: {
          title,
          script,
          status: 'SCRIPT_READY',
          error: null,
        },
      });

      logger.info('Video script ready for review', { outputId });
    } catch (error) {
      logger.error('Video Script Generation Error', {
        error: error instanceof Error ? error.message : error,
        outputId,
      });

      // Mark as failed
      await prisma.videoOutput.update({
        where: { id: outputId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
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
      GUJARATI: 'Gujarati',
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
}

// Singleton instance
export const videoScriptService = new VideoScriptService();
