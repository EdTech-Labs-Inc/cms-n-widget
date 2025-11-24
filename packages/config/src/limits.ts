/**
 * Character Limits and Constraints
 *
 * Defines character limits for various media generation features
 * These limits ensure content fits within external service constraints
 * and maintains quality/readability
 */

/**
 * Video script character limits
 */
export const VIDEO_SCRIPT_LIMITS = {
  /**
   * Maximum characters per video script
   * HeyGen limit is 1500, we use 1400 to leave a buffer
   */
  MAX_SCRIPT_LENGTH: 1400,

  /**
   * Minimum characters per video script
   */
  MIN_SCRIPT_LENGTH: 100,

  /**
   * Recommended optimal length for engagement
   */
  OPTIMAL_SCRIPT_LENGTH: 800,
} as const;

/**
 * Video bubble (quiz question) character limits
 */
export const VIDEO_BUBBLE_LIMITS = {
  /**
   * Maximum characters for bubble question text
   * Must be short to fit in video overlay
   */
  MAX_QUESTION_LENGTH: 40,

  /**
   * Maximum characters for each answer option
   * Must be very short to fit in bubble buttons
   */
  MAX_OPTION_LENGTH: 10,

  /**
   * Maximum number of bubbles per video
   */
  MAX_BUBBLES_PER_VIDEO: 15,

  /**
   * Minimum number of bubbles per video
   */
  MIN_BUBBLES_PER_VIDEO: 3,

  /**
   * Recommended number of bubbles
   */
  OPTIMAL_BUBBLES_PER_VIDEO: 5,
} as const;

/**
 * Quiz question limits
 */
export const QUIZ_LIMITS = {
  /**
   * Maximum number of questions per quiz
   */
  MAX_QUESTIONS: 15,

  /**
   * Minimum number of questions per quiz
   */
  MIN_QUESTIONS: 5,

  /**
   * Recommended number of questions
   */
  OPTIMAL_QUESTIONS: 10,

  /**
   * Maximum number of options for MCQ
   */
  MAX_MCQ_OPTIONS: 6,

  /**
   * Minimum number of options for MCQ
   */
  MIN_MCQ_OPTIONS: 2,
} as const;

/**
 * Podcast script limits
 */
export const PODCAST_LIMITS = {
  /**
   * Minimum number of exchanges (back-and-forth) in podcast
   */
  MIN_EXCHANGES: 8,

  /**
   * Maximum number of exchanges
   */
  MAX_EXCHANGES: 12,

  /**
   * Recommended number of exchanges
   */
  OPTIMAL_EXCHANGES: 10,

  /**
   * Minimum sentences per exchange
   */
  MIN_SENTENCES_PER_EXCHANGE: 2,

  /**
   * Maximum sentences per exchange
   */
  MAX_SENTENCES_PER_EXCHANGE: 4,
} as const;

/**
 * Interactive podcast limits
 */
export const INTERACTIVE_PODCAST_LIMITS = {
  /**
   * Minimum word count for interactive podcast script
   */
  MIN_WORD_COUNT: 750,

  /**
   * Maximum word count for interactive podcast script
   */
  MAX_WORD_COUNT: 900,

  /**
   * Recommended word count
   */
  OPTIMAL_WORD_COUNT: 800,

  /**
   * Minimum number of interactive words (fill-in-the-blank)
   */
  MIN_INTERACTIVE_WORDS: 8,

  /**
   * Maximum number of interactive words
   */
  MAX_INTERACTIVE_WORDS: 10,
} as const;

/**
 * Audio script limits
 */
export const AUDIO_LIMITS = {
  /**
   * Maximum characters for audio script
   */
  MAX_SCRIPT_LENGTH: 5000,

  /**
   * Minimum characters for audio script
   */
  MIN_SCRIPT_LENGTH: 100,
} as const;

/**
 * Title and metadata limits
 */
export const METADATA_LIMITS = {
  /**
   * Maximum characters for titles
   */
  MAX_TITLE_LENGTH: 100,

  /**
   * Minimum characters for titles
   */
  MIN_TITLE_LENGTH: 5,

  /**
   * Maximum characters for descriptions
   */
  MAX_DESCRIPTION_LENGTH: 500,

  /**
   * Maximum characters for explanations
   */
  MAX_EXPLANATION_LENGTH: 200,
} as const;

/**
 * Language-specific character adjustments
 * Some languages require more/fewer characters for same meaning
 */
export const LANGUAGE_ADJUSTMENTS = {
  ENGLISH: 1.0,
  MARATHI: 1.2, // May need slightly more characters
  HINDI: 1.2,
  BENGALI: 1.2,
} as const;

/**
 * Get adjusted limit for a specific language
 */
export function getAdjustedLimit(baseLimit: number, language: keyof typeof LANGUAGE_ADJUSTMENTS): number {
  const adjustment = LANGUAGE_ADJUSTMENTS[language] || 1.0;
  return Math.floor(baseLimit * adjustment);
}

/**
 * Validate video script length
 */
export function isValidVideoScriptLength(length: number): boolean {
  return (
    length >= VIDEO_SCRIPT_LIMITS.MIN_SCRIPT_LENGTH &&
    length <= VIDEO_SCRIPT_LIMITS.MAX_SCRIPT_LENGTH
  );
}

/**
 * Validate bubble question length
 */
export function isValidBubbleQuestionLength(length: number): boolean {
  return length > 0 && length <= VIDEO_BUBBLE_LIMITS.MAX_QUESTION_LENGTH;
}

/**
 * Validate bubble option length
 */
export function isValidBubbleOptionLength(length: number): boolean {
  return length > 0 && length <= VIDEO_BUBBLE_LIMITS.MAX_OPTION_LENGTH;
}

/**
 * Validate number of bubbles
 */
export function isValidBubbleCount(count: number): boolean {
  return (
    count >= VIDEO_BUBBLE_LIMITS.MIN_BUBBLES_PER_VIDEO &&
    count <= VIDEO_BUBBLE_LIMITS.MAX_BUBBLES_PER_VIDEO
  );
}
