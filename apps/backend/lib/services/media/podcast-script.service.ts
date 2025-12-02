import { agentaOpenAIService } from '../external/agenta-openai.service';
import { prisma } from '../../config/database';
import { PodcastTranscript, PodcastTranscriptSchema } from '@repo/types';
import { logger } from '@repo/logging';

/**
 * Podcast Script Service - Generate podcast transcript only (no audio)
 *
 * This is part of the decoupled generation flow where:
 * 1. Transcript is generated first and enters SCRIPT_READY state
 * 2. User can review and edit the transcript
 * 3. Once approved, podcast-media.service generates the actual audio
 */
export class PodcastScriptService {
  /**
   * Generate podcast transcript for an article
   * Sets status to SCRIPT_READY after successful generation
   */
  async generatePodcastTranscript(
    articleId: string,
    outputId: string,
    language: string = 'ENGLISH',
    organizationId: string
  ): Promise<void> {
    try {
      // Update status to PROCESSING
      await prisma.podcastOutput.update({
        where: { id: outputId },
        data: { status: 'PROCESSING' },
      });

      // Get article content
      const article = await prisma.article.findUnique({
        where: { id: articleId },
      });

      if (!article) {
        throw new Error('Article not found');
      }

      logger.info('Generating podcast transcript', {
        articleTitle: article.title,
        language,
        outputId,
      });

      // Step 1: Generate podcast title using OpenAI
      const podcastTitle = await this.generatePodcastTitle(
        article.title,
        article.content,
        language
      );
      logger.info('Generated podcast title', { podcastTitle, outputId });

      // Step 2: Generate podcast transcript (interviewer + guest format)
      const transcript = await this.generateTranscript(
        article.title,
        article.content,
        language
      );
      const segments = transcript.segments as Array<{ speaker: 'interviewer' | 'guest'; text: string }>;

      logger.info('Generated podcast transcript', {
        outputId,
        segmentCount: segments.length,
      });

      // Update PodcastOutput with title and transcript, set status to SCRIPT_READY
      await prisma.podcastOutput.update({
        where: { id: outputId },
        data: {
          title: podcastTitle,
          transcript: JSON.stringify(segments),
          status: 'SCRIPT_READY',
          error: null,
        },
      });

      logger.info('Podcast transcript ready for review', { outputId });
    } catch (error) {
      logger.error('Podcast Transcript Generation Error', {
        error: error instanceof Error ? error.message : error,
        outputId,
      });

      // Mark as failed
      await prisma.podcastOutput.update({
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
   * Generate an engaging podcast title using Agenta prompts
   */
  private async generatePodcastTitle(
    articleTitle: string,
    articleContent: string,
    language: string
  ): Promise<string> {
    const languageMap: Record<string, string> = {
      ENGLISH: 'English',
      MARATHI: 'Marathi',
      HINDI: 'Hindi',
      BENGALI: 'Bengali',
    };
    const languageName = languageMap[language] || 'English';

    const title = await agentaOpenAIService.generateText({
      promptSlug: 'generate_podcast_title_prompt',
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
   * Generate podcast transcript with interviewer + guest format using Agenta prompts
   */
  private async generateTranscript(
    title: string,
    content: string,
    language: string
  ): Promise<PodcastTranscript> {
    const languageMap: Record<string, string> = {
      ENGLISH: 'English',
      MARATHI: 'Marathi',
      HINDI: 'Hindi',
      BENGALI: 'Bengali',
    };
    const languageName = languageMap[language] || 'English';

    const result = await agentaOpenAIService.generateStructured({
      promptSlug: 'generate_podcast_transcript_prompt',
      variables: {
        articleTitle: title,
        articleContent: content,
        languageName,
      },
      schema: PodcastTranscriptSchema,
      schemaName: 'PodcastTranscript',
      temperature: 0.8, // Higher creativity for natural conversation
    });

    return result as PodcastTranscript;
  }
}

// Singleton instance
export const podcastScriptService = new PodcastScriptService();
