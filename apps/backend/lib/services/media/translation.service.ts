import { logger } from '@repo/logging';
import { LANGUAGE_CODES } from '@repo/config';
import { openaiClientService } from '../external/openai-client.service';

type Language = 'ENGLISH' | 'MARATHI' | 'HINDI' | 'BENGALI' | 'GUJARATI';

/**
 * Translation Service
 *
 * Translates video scripts and titles between supported languages using OpenAI.
 * Optimized for video content with natural, conversational translations.
 */
class TranslationService {
  /**
   * Translate a video script to the target language
   *
   * @param script - The original script in English
   * @param targetLanguage - The target language code
   * @returns Translated script
   */
  async translateScript(script: string, targetLanguage: Language): Promise<string> {
    if (targetLanguage === 'ENGLISH') {
      return script;
    }

    const targetLanguageName = LANGUAGE_CODES[targetLanguage]?.name || targetLanguage;

    logger.info('Translating video script', {
      targetLanguage,
      targetLanguageName,
      scriptLength: script.length,
    });

    try {
      const systemPrompt = `You are a professional translator specializing in video scripts and spoken content. Your translations should:
- Sound natural and conversational when spoken aloud
- Preserve the tone, emotion, and intent of the original
- Be culturally appropriate for the target audience
- Maintain the same length and pacing as the original (suitable for video voiceover)
- Use colloquial language appropriate for social media videos

Translate the following script from English to ${targetLanguageName}. Return ONLY the translated text, nothing else.`;

      const result = await openaiClientService.generateText({
        prompt: script,
        systemPrompt,
        model: 'gpt-4o',
        temperature: 0.3, // Lower temperature for more consistent translations
      });

      logger.info('Script translation completed', {
        targetLanguage,
        originalLength: script.length,
        translatedLength: result.length,
      });

      return result.trim();
    } catch (error) {
      logger.error('Script translation failed', {
        targetLanguage,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Translate a video title to the target language
   *
   * @param title - The original title in English
   * @param targetLanguage - The target language code
   * @returns Translated title
   */
  async translateTitle(title: string, targetLanguage: Language): Promise<string> {
    if (targetLanguage === 'ENGLISH') {
      return title;
    }

    const targetLanguageName = LANGUAGE_CODES[targetLanguage]?.name || targetLanguage;

    logger.info('Translating video title', {
      targetLanguage,
      targetLanguageName,
      title,
    });

    try {
      const systemPrompt = `You are a professional translator. Translate the following video title from English to ${targetLanguageName}.
- Keep it concise and engaging
- Preserve the meaning and appeal
- Make it culturally appropriate

Return ONLY the translated title, nothing else.`;

      const result = await openaiClientService.generateText({
        prompt: title,
        systemPrompt,
        model: 'gpt-4o',
        temperature: 0.3,
        maxTokens: 200, // Titles should be short
      });

      logger.info('Title translation completed', {
        targetLanguage,
        originalTitle: title,
        translatedTitle: result.trim(),
      });

      return result.trim();
    } catch (error) {
      logger.error('Title translation failed', {
        targetLanguage,
        title,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Translate both script and title in a single call
   *
   * @param script - The original script in English
   * @param title - The original title in English
   * @param targetLanguage - The target language code
   * @returns Object with translated script and title
   */
  async translateScriptAndTitle(
    script: string,
    title: string,
    targetLanguage: Language
  ): Promise<{ translatedScript: string; translatedTitle: string }> {
    if (targetLanguage === 'ENGLISH') {
      return { translatedScript: script, translatedTitle: title };
    }

    // Run translations in parallel for better performance
    const [translatedScript, translatedTitle] = await Promise.all([
      this.translateScript(script, targetLanguage),
      this.translateTitle(title, targetLanguage),
    ]);

    return { translatedScript, translatedTitle };
  }
}

// Singleton instance
export const translationService = new TranslationService();
