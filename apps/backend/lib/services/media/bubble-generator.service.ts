import { openaiService } from '../external/openai.service';
import { prisma } from '../../config/database';
import { VideoBubblesSchema } from '@/types/schemas';
import { VideoBubble } from '@/types/media.types';
import { logger } from '@repo/logging';

/**
 * Bubble Generator Service - Generate and validate bubble questions for videos
 *
 * Handles:
 * - Bubble question generation with timing
 * - Character constraint validation
 * - Single bubble regeneration on validation failure
 */
export class BubbleGeneratorService {
  /**
   * Validate a bubble meets character constraints
   * Question must be < 40 chars, each option must be < 10 chars
   */
  private validateBubbleConstraints(bubble: VideoBubble): boolean {
    // Check question length
    if (bubble.question.length >= 40) {
      return false;
    }

    // Check options length (if present)
    if (bubble.options) {
      for (const option of bubble.options) {
        if (option.length >= 10) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Regenerate a single bubble that failed validation
   * Returns null if unable to generate valid bubble after max retries
   */
  private async regenerateSingleBubble(
    appearsAt: number,
    script: string,
    articleContent: string,
    durationSeconds: number,
    language: string = 'ENGLISH',
    maxRetries: number = 3
  ): Promise<VideoBubble | null> {
    const languageMap: Record<string, string> = {
      ENGLISH: 'English',
      MARATHI: 'Marathi',
      HINDI: 'Hindi',
      BENGALI: 'Bengali',
    };
    const languageName = languageMap[language] || 'English';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const prompt = `regenerate_single_bubble_prompt`;

        const SingleBubbleSchema = VideoBubblesSchema.extend({
          bubbles: VideoBubblesSchema.shape.bubbles.min(1).max(1),
        });

        const result = await openaiService.generateStructured({
          prompt,
          schema: SingleBubbleSchema,
          schemaName: 'SingleBubble',
          systemPrompt: `regenerate_single_bubble_system_prompt`,
          temperature: 0.6,
        });

        const bubble = result.bubbles[0] as VideoBubble;

        if (this.validateBubbleConstraints(bubble)) {
          logger.info('Successfully regenerated bubble', { appearsAt, attempt });
          return bubble;
        }

        logger.warn('Regenerated bubble still exceeds constraints', { appearsAt, attempt });
      } catch (error) {
        logger.error('Error regenerating bubble', {
          appearsAt,
          attempt,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.warn('Failed to generate valid bubble after retries', {
      appearsAt,
      maxRetries
    });
    return null;
  }

  /**
   * Generate bubble questions for a video
   * Uses word-level timings to determine precise bubble placement (appearsAt in milliseconds)
   */
  async generateVideoBubbles(
    script: string,
    articleContent: string,
    transcript: string,
    durationSeconds: number,
    language: string = 'ENGLISH',
    wordTimings: Array<{ text: string; start_time: number; end_time: number }> = []
  ): Promise<VideoBubble[]> {
    const languageMap: Record<string, string> = {
      ENGLISH: 'English',
      MARATHI: 'Marathi',
      HINDI: 'Hindi',
      BENGALI: 'Bengali',
    };
    const languageName = languageMap[language] || 'English';

    const prompt = `generate_video_bubbles_prompt`;

    const result = await openaiService.generateStructured({
      prompt,
      schema: VideoBubblesSchema,
      schemaName: 'VideoBubbles',
      systemPrompt: `generate_video_bubbles_system_prompt`,
      temperature: 0.6,
    });

    const initialBubbles = result.bubbles as VideoBubble[];
    const validBubbles: VideoBubble[] = [];

    // Validate each bubble and retry invalid ones
    for (const bubble of initialBubbles) {
      if (this.validateBubbleConstraints(bubble)) {
        validBubbles.push(bubble);
        logger.debug('Bubble passes constraints', { appearsAt: bubble.appearsAt });
      } else {
        logger.warn('Bubble exceeds constraints, attempting retry', {
          appearsAt: bubble.appearsAt,
          questionLength: bubble.question.length,
          optionsLengths: bubble.options?.map(o => o.length)
        });

        // Try to regenerate this specific bubble
        const regeneratedBubble = await this.regenerateSingleBubble(
          bubble.appearsAt,
          script,
          articleContent,
          durationSeconds,
          language
        );

        if (regeneratedBubble) {
          validBubbles.push(regeneratedBubble);
        }
        // If regeneration failed, bubble is left out
      }
    }

    logger.info('Bubble generation complete', {
      validCount: validBubbles.length,
      totalCount: initialBubbles.length
    });
    return validBubbles;
  }
}

// Singleton instance
export const bubbleGeneratorService = new BubbleGeneratorService();
