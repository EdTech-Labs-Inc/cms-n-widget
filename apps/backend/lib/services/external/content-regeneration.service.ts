import { z } from 'zod';
import { openaiClientService } from './openai-client.service';

/**
 * Content Regeneration Service - Domain-specific content generation
 *
 * This service handles regeneration of domain-specific content types:
 * - Article cleaning and title extraction
 * - Video script regeneration
 * - Podcast transcript regeneration
 * - Interactive podcast script regeneration
 *
 *  NOTE: This service currently contains embedded AI prompts.
 * TODO: Move prompts to @repo/config for better maintainability.
 *
 * Uses the OpenAI Client Service for all API calls.
 */
export class ContentRegenerationService {
  /**
   * Clean article content by removing fluff and extract the actual title
   * Removes non-article content from the beginning and end (like headers, footers, metadata)
   * and extracts the most appropriate title from the article
   *
   *  TODO: Move prompt to @repo/config
   */
  async cleanArticleContent(params: {
    rawContent: string;
    model?: string;
  }): Promise<{ title: string; cleanedContent: string }> {
    const schema = z.object({
      title: z.string().describe('The actual title of the article extracted from the content'),
      cleanedContent: z.string().describe('The article content with fluff removed from the top and bottom'),
    });

    // � TODO: Externalize this prompt to @repo/config
    const prompt = `clean_article_content_prompt`;

    const systemPrompt = 'clean_article_content_system_prompt';

    const result = await openaiClientService.generateStructured({
      prompt,
      schema,
      schemaName: 'CleanedArticle',
      model: params.model,
      temperature: 0.3,
      systemPrompt,
    });

    return result as { title: string; cleanedContent: string };
  }

  /**
   * Regenerate video script with user guidance
   * Takes the original script, user prompt guidance, and article context to create an improved version
   *
   * � TODO: Move prompts to @repo/config
   */
  async regenerateVideoScript(params: {
    originalScript: string;
    promptGuidance: string;
    articleTitle: string;
    articleContent: string;
    language?: string;
  }): Promise<string> {
    const language = params.language || 'ENGLISH';
    const languageMap: Record<string, string> = {
      ENGLISH: 'English',
      MARATHI: 'Marathi',
      HINDI: 'Hindi',
      BENGALI: 'Bengali',
    };
    const languageName = languageMap[language] || 'English';

    // � TODO: Externalize this prompt to @repo/config
    const prompt = `regenerate_video_script_prompt`;

    const systemPrompt = `regenerate_video_script_system_prompt`;

    return await openaiClientService.generateText({
      prompt,
      systemPrompt,
      temperature: 0.7,
    });
  }

  /**
   * Regenerate podcast transcript with user guidance
   * Takes the original transcript segments, user prompt guidance, and article context to create an improved version
   *
   * � TODO: Move prompts to @repo/config
   */
  async regeneratePodcastTranscript(params: {
    originalTranscript: string; // JSON string of segments
    promptGuidance: string;
    articleTitle: string;
    articleContent: string;
    language?: string;
  }): Promise<string> {
    const language = params.language || 'ENGLISH';
    const languageMap: Record<string, string> = {
      ENGLISH: 'English',
      MARATHI: 'Marathi',
      HINDI: 'Hindi',
      BENGALI: 'Bengali',
    };
    const languageName = languageMap[language] || 'English';

    // Parse the original transcript to show it in a readable format
    let readableTranscript = '';
    try {
      const segments = JSON.parse(params.originalTranscript) as Array<{ speaker: string; text: string }>;
      readableTranscript = segments
        .map((seg, i) => `${i + 1}. ${seg.speaker === 'interviewer' ? 'Interviewer (Herin)' : 'Guest (Isha)'}: ${seg.text}`)
        .join('\n\n');
    } catch {
      readableTranscript = params.originalTranscript;
    }

    // � TODO: Externalize this prompt to @repo/config
    const prompt = `regenerate_podcast_transcript_prompt`;

    const systemPrompt = `regenerate_podcast_transcript_system_prompt`;

    const result = await openaiClientService.generateText({
      prompt,
      systemPrompt,
      temperature: 0.7,
    });

    // Extract JSON from the response (in case it's wrapped in markdown code blocks)
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    return result;
  }

  /**
   * Regenerate interactive podcast script with user guidance
   * Takes the original script, user prompt guidance, and article context to create an improved version
   *
   * � TODO: Move prompts to @repo/config
   */
  async regenerateInteractivePodcastScript(params: {
    originalScript: string;
    promptGuidance: string;
    articleTitle: string;
    articleContent: string;
    language?: string;
  }): Promise<string> {
    const language = params.language || 'ENGLISH';
    const languageMap: Record<string, string> = {
      ENGLISH: 'English',
      MARATHI: 'Marathi',
      HINDI: 'Hindi',
      BENGALI: 'Bengali',
    };
    const languageName = languageMap[language] || 'English';

    // � TODO: Externalize this prompt to @repo/config
    const prompt = `regenerate_interactive_podcast_script_prompt`;

    const systemPrompt = `regenerate_interactive_podcast_script_system_prompt`;

    return await openaiClientService.generateText({
      prompt,
      systemPrompt,
      temperature: 0.7,
    });
  }
}

// Singleton instance
export const contentRegenerationService = new ContentRegenerationService();
