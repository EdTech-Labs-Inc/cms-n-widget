import { logger } from '@repo/logging';

/**
 * Segment Parser Service - Parse word timings into transcript segments
 *
 * Handles:
 * - Grouping words into natural segments (by sentences/phrases)
 * - Smart boundary detection (sentence endings, abbreviations)
 * - Segment length optimization
 */
export class SegmentParserService {
  /**
   * Parse word timings into TranscriptSegments (group by sentences/phrases)
   * Now with punctuation attached to words from AWS Transcribe
   */
  async parseIntoSegments(
    wordTimings: Array<{ text: string; start_time: number; end_time: number }>,
    script: string
  ): Promise<Array<{
    id: string;
    startTime: number;
    endTime: number;
    text: string;
    words: Array<{ text: string; start_time: number; end_time: number }>;
  }>> {
    const segments: Array<any> = [];
    let currentSegment: Array<{ text: string; start_time: number; end_time: number }> = [];

    // Configuration for natural segment boundaries
    const MIN_SEGMENT_WORDS = 25;  // Minimum words before considering a split
    const TARGET_SEGMENT_WORDS = 60; // Ideal segment length for natural listening
    const MAX_SEGMENT_WORDS = 100;   // Force split at this length

    // Sentence-ending punctuation (attached to words from AWS Transcribe)
    const sentenceEnders = /[.!?]$/;

    // Common abbreviations that shouldn't trigger splits
    const abbreviations = /^(Dr|Mr|Mrs|Ms|Prof|Sr|Jr|vs|etc|e\.g|i\.e)\.$/i;

    for (let i = 0; i < wordTimings.length; i++) {
      const word = wordTimings[i];
      currentSegment.push(word);

      // Check if this word ends a sentence (but not an abbreviation)
      const endsWithPunctuation = sentenceEnders.test(word.text);
      const isAbbreviation = abbreviations.test(word.text);
      const wordCount = currentSegment.length;

      // Determine if we should split here
      let shouldSplit = false;

      if (wordCount >= MAX_SEGMENT_WORDS) {
        // Force split - segment is too long
        shouldSplit = true;
      } else if (wordCount >= MIN_SEGMENT_WORDS && endsWithPunctuation && !isAbbreviation) {
        // Natural split point - we've reached minimum length and found a sentence boundary

        // If we're close to or past target length, split now
        if (wordCount >= TARGET_SEGMENT_WORDS) {
          shouldSplit = true;
        } else {
          // We're between MIN and TARGET - look ahead to decide
          // If next few words suggest a topic change or we're approaching target, split
          // Otherwise, keep accumulating for a more substantial segment
          const remainingWords = wordTimings.length - i - 1;
          const distanceFromTarget = TARGET_SEGMENT_WORDS - wordCount;

          // Split if:
          // - We're getting close to target (within 10 words)
          // - Or there aren't many words left
          if (distanceFromTarget <= 10 || remainingWords < MIN_SEGMENT_WORDS) {
            shouldSplit = true;
          }
        }
      }

      if (shouldSplit && currentSegment.length > 0) {
        // Reconstruct text from words (with spaces)
        const segmentText = currentSegment.map(w => w.text).join(' ');

        segments.push({
          id: `segment-${segments.length}`,
          startTime: currentSegment[0].start_time,
          endTime: currentSegment[currentSegment.length - 1].end_time,
          text: segmentText,
          words: [...currentSegment],
        });

        logger.debug('Created segment', {
          segmentIndex: segments.length,
          wordCount: currentSegment.length
        });
        currentSegment = [];
      }
    }

    // Add any remaining words as final segment
    if (currentSegment.length > 0) {
      const segmentText = currentSegment.map(w => w.text).join(' ');
      segments.push({
        id: `segment-${segments.length}`,
        startTime: currentSegment[0].start_time,
        endTime: currentSegment[currentSegment.length - 1].end_time,
        text: segmentText,
        words: [...currentSegment],
      });
      logger.debug('Created final segment', {
        segmentIndex: segments.length,
        wordCount: currentSegment.length
      });
    }

    const avgWordsPerSegment = Math.round(wordTimings.length / segments.length);
    logger.info('Segment parsing complete', {
      segmentCount: segments.length,
      totalWords: wordTimings.length,
      avgWordsPerSegment
    });
    return segments;
  }
}

// Singleton instance
export const segmentParserService = new SegmentParserService();
