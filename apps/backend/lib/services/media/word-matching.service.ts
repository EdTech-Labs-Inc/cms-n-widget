import { agentaOpenAIService } from '../external/agenta-openai.service';
import { z } from 'zod';
import { logger } from '@repo/logging';

// Zod schema for AI-based word selection
const InteractiveWordSchema = z.object({
  word: z.string().describe('The educational word to make interactive'),
  distractor: z.string().describe('A plausible but incorrect alternative to the word'),
  explanation: z.string().describe('Brief explanation of why this word is educational (1 sentence)')
});

const InteractiveWordsResponseSchema = z.object({
  interactiveWords: z.array(InteractiveWordSchema)
    .min(8)
    .max(10)
    .describe('8-10 key educational words from the podcast with their distractors')
});

/**
 * Word Matching Service - Generate and match interactive words in podcast segments
 *
 * Handles:
 * - AI-based educational word selection
 * - Distractor generation for fill-in-the-blank questions
 * - Word-to-segment matching and timing
 */
export class WordMatchingService {
  /**
   * AI-based word and distractor selection
   * Replace complex buggy algorithmic approach with single OpenAI call
   */
  async generateInteractiveWords(
    script: string,
    articleContent: string,
    language: string
  ): Promise<Array<{ word: string; distractor: string; explanation: string }>> {
    const languageMap: Record<string, string> = {
      ENGLISH: 'English',
      MARATHI: 'Marathi',
      HINDI: 'Hindi',
      BENGALI: 'Bengali',
    };
    const languageName = languageMap[language] || 'English';

    const result = await agentaOpenAIService.generateStructured({
      promptSlug: 'generate_interactive_words_prompt',
      variables: {
        script,
        articleContent,
        language: languageName,
      },
      schema: InteractiveWordsResponseSchema,
      schemaName: 'InteractiveWords',
      temperature: 0.7,
    });

    logger.info('AI selected interactive words', { count: result.interactiveWords.length });
    return result.interactiveWords as Array<{ word: string; distractor: string; explanation: string }>;
  }

  /**
   * Add interactive fill-in-the-blank questions using AI-selected words
   */
  async addInteractiveQuestions(
    segments: Array<any>,
    articleContent: string,
    language: string
  ): Promise<Array<any>> {
    // Build complete script from segments
    const script = segments.map(s => s.text).join(' ');

    // Get AI-selected words with distractors
    const interactiveWords = await this.generateInteractiveWords(script, articleContent, language);

    logger.info('Processing interactive words into segments', { wordCount: interactiveWords.length });

    // For each selected word, find it in the segments and mark that segment as interactive
    const segmentsWithInteractive = segments.map(segment => ({ ...segment }));

    for (const { word, distractor, explanation } of interactiveWords) {
      // Clean the word (remove punctuation for matching)
      const cleanWord = word.replace(/[.,!?;:"']$/g, '').trim();

      // Find the segment containing this word (case-insensitive, fuzzy match)
      const segmentIndex = segmentsWithInteractive.findIndex(seg => {
        // Check if segment already has interactive (skip if so)
        if (seg.interactive) return false;

        // Try exact match first
        if (seg.text.includes(word)) return true;

        // Try case-insensitive match
        const regex = new RegExp(`\\b${cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return regex.test(seg.text);
      });

      if (segmentIndex === -1) {
        logger.warn('Could not find word in any segment', { word });
        continue;
      }

      const segment = segmentsWithInteractive[segmentIndex];

      // Find the word object in the segment's words array
      const wordIndex = segment.words?.findIndex((w: any) => {
        const cleanWordText = w.text.replace(/[.,!?;:"']$/g, '').trim();
        return cleanWordText.toLowerCase() === cleanWord.toLowerCase();
      });

      if (wordIndex === undefined || wordIndex === -1 || !segment.words) {
        logger.warn('Could not find word timing', { word });
        continue;
      }

      const wordObj = segment.words[wordIndex];

      // Create the question by replacing the word with blank
      const questionText = segment.text.replace(
        new RegExp(`\\b${cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
        '____'
      );

      // Randomize option order (correct answer + distractor)
      const options = [word, distractor];
      // Fisher-Yates shuffle
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      // Split words array into before and after interactive word
      // This allows the frontend to animate words before the question, show the question, then animate remaining words
      const wordsBeforeInteractive = segment.words.slice(0, wordIndex);
      const wordsAfterInteractive = segment.words.slice(wordIndex + 1); // Exclude the interactive word itself

      // Add interactive to this segment
      segmentsWithInteractive[segmentIndex].interactive = {
        triggerTime: wordObj.start_time, // Time in seconds when word is spoken
        type: 'fill-blank',
        question: questionText,
        options: options,
        correctAnswer: word,
        explanation: explanation,
      };

      // Split the words array for smooth animation
      segmentsWithInteractive[segmentIndex].wordsBeforeInteractive = wordsBeforeInteractive;
      segmentsWithInteractive[segmentIndex].wordsAfterInteractive = wordsAfterInteractive;

      logger.info('Added interactive question', {
        word,
        time: wordObj.start_time.toFixed(1),
        segmentIndex,
        wordsBefore: wordsBeforeInteractive.length,
        wordsAfter: wordsAfterInteractive.length
      });
    }

    const interactiveCount = segmentsWithInteractive.filter(s => s.interactive).length;
    logger.info('Successfully created interactive segments', { interactiveCount });

    return segmentsWithInteractive;
  }
}

// Singleton instance
export const wordMatchingService = new WordMatchingService();
