import { agentaOpenAIService } from '../external/agenta-openai.service';
import { prisma } from '../../config/database';
import { logger } from '@repo/logging';

/**
 * Interactive Podcast Script Service - Generate script only (no audio)
 *
 * This is part of the decoupled generation flow where:
 * 1. Script is generated first and enters SCRIPT_READY state
 * 2. User can review and edit the script
 * 3. Once approved, interactive-podcast-media.service generates the actual audio
 */
export class InteractivePodcastScriptService {
  /**
   * Generate interactive podcast script for an article
   * Sets status to SCRIPT_READY after successful generation
   */
  async generateInteractivePodcastScript(
    articleId: string,
    outputId: string,
    language: string = 'ENGLISH',
    organizationId: string
  ): Promise<void> {
    try {
      // Update status to PROCESSING
      await prisma.interactivePodcastOutput.update({
        where: { id: outputId },
        data: { status: 'PROCESSING' },
      });

      // Get article content
      const ipOutput = await prisma.interactivePodcastOutput.findUnique({
        where: { id: outputId },
        include: {
          submission: {
            include: { article: true },
          },
        },
      });

      if (!ipOutput?.submission?.article) {
        throw new Error('Article not found');
      }

      const article = ipOutput.submission.article;
      const languageToUse = ipOutput.submission.language || language;

      logger.info('Generating interactive podcast script', {
        articleTitle: article.title,
        language: languageToUse,
        outputId,
      });

      // Step 1: Generate title using OpenAI
      const title = await this.generateInteractivePodcastTitle(
        article.title,
        article.content,
        languageToUse
      );
      logger.info('Generated interactive podcast title', { title, outputId });

      // Step 2: Generate audio script (single speaker, engaging narrative)
      const script = await this.generateAudioScript(
        article.title,
        article.content,
        languageToUse
      );
      logger.info('Generated interactive podcast script', {
        outputId,
        scriptLength: script.length,
      });

      // Store script in segments field as { script: "..." } for consistency with regeneration
      // This allows the edit page to extract and display the script
      await prisma.interactivePodcastOutput.update({
        where: { id: outputId },
        data: {
          title,
          segments: { script },
          status: 'SCRIPT_READY',
          error: null,
        },
      });

      logger.info('Interactive podcast script ready for review', { outputId });
    } catch (error) {
      logger.error('Interactive Podcast Script Generation Error', {
        error: error instanceof Error ? error.message : error,
        outputId,
      });

      // Mark as failed
      await prisma.interactivePodcastOutput.update({
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
   * Generate title for interactive podcast (standalone educational podcast with questions)
   */
  private async generateInteractivePodcastTitle(
    articleTitle: string,
    articleContent: string,
    language: string
  ): Promise<string> {
    const languageMap: Record<string, string> = {
      ENGLISH: 'English',
      MARATHI: 'Marathi',
      HINDI: 'Hindi',
      BENGALI: 'Bengali',
      GUJARATI: 'Gujarati',
    };
    const languageName = languageMap[language] || 'English';

    const title = await agentaOpenAIService.generateText({
      promptSlug: 'generate_interactive_podcast_title_prompt',
      variables: {
        articleTitle,
        articleContent,
        languageName,
      },
      temperature: 0.7,
      maxTokens: 50,
    });

    return title.trim();
  }

  /**
   * Generate single-speaker casual educational podcast script
   */
  private async generateAudioScript(
    articleTitle: string,
    articleContent: string,
    language: string
  ): Promise<string> {
    const languageMap: Record<string, string> = {
      ENGLISH: 'English',
      MARATHI: 'Marathi',
      HINDI: 'Hindi',
      BENGALI: 'Bengali',
      GUJARATI: 'Gujarati',
    };
    const languageName = languageMap[language] || 'English';

    const script = await agentaOpenAIService.generateText({
      promptSlug: 'generate_interactive_podcast_script_prompt',
      variables: {
        articleTitle,
        articleContent,
        languageName,
      },
      temperature: 0.7,
      maxTokens: 1200,
    });

    return script.trim();
  }
}

// Singleton instance
export const interactivePodcastScriptService = new InteractivePodcastScriptService();
