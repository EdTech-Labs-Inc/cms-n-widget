import { z } from 'zod';
import { agentaOpenAIService } from './agenta-openai.service';

/**
 * Content Regeneration Service - Domain-specific content generation
 *
 * This service handles regeneration of domain-specific content types:
 * - Article cleaning and title extraction
 * - Video script regeneration
 * - Podcast transcript regeneration
 * - Interactive podcast script regeneration
 *
 * Uses Agenta for prompt management and OpenAI for execution.
 */
export class ContentRegenerationService {
  /**
   * Clean article content by removing fluff and extract the actual title
   * Removes non-article content from the beginning and end (like headers, footers, metadata)
   * and extracts the most appropriate title from the article
   */
  async cleanArticleContent(params: {
    rawContent: string;
  }): Promise<{ title: string; cleanedContent: string }> {
    const schema = z.object({
      title: z.string().describe('The actual title of the article extracted from the content'),
      cleanedContent: z.string().describe('The article content with fluff removed from the top and bottom'),
    });

    const result = await agentaOpenAIService.generateStructured({
      promptSlug: 'clean_article_content_prompt',
      variables: {
        rawContent: params.rawContent,
      },
      schema,
      schemaName: 'CleanedArticle',
      temperature: 0.3,
    });

    return result as { title: string; cleanedContent: string };
  }

  /**
   * Regenerate video script with user guidance
   * Takes the original script, user prompt guidance, and article context to create an improved version
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

    return await agentaOpenAIService.generateText({
      promptSlug: 'regenerate_video_script_prompt',
      variables: {
        originalScript: params.originalScript,
        promptGuidance: params.promptGuidance,
        articleTitle: params.articleTitle,
        articleContent: params.articleContent,
        language: languageName,
      },
      temperature: 0.7,
    });
  }

  /**
   * Regenerate podcast transcript with user guidance
   * Takes the original transcript segments, user prompt guidance, and article context to create an improved version
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

    const result = await agentaOpenAIService.generateText({
      promptSlug: 'regenerate_podcast_transcript_prompt',
      variables: {
        originalTranscript: readableTranscript,
        promptGuidance: params.promptGuidance,
        articleTitle: params.articleTitle,
        articleContent: params.articleContent,
        language: languageName,
      },
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

    return await agentaOpenAIService.generateText({
      promptSlug: 'regenerate_interactive_podcast_script_prompt',
      variables: {
        originalScript: params.originalScript,
        promptGuidance: params.promptGuidance,
        articleTitle: params.articleTitle,
        articleContent: params.articleContent,
        language: languageName,
      },
      temperature: 0.7,
    });
  }
}

// Singleton instance
export const contentRegenerationService = new ContentRegenerationService();
