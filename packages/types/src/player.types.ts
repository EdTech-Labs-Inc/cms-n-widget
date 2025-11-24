/**
 * Player-specific types
 * For video player, quiz player, and interactive podcast player
 */

// ============================================
// VIDEO PLAYER TYPES
// ============================================

/**
 * Simplified Bubble interface for player components
 * Based on VideoBubble database model but with player-specific fields
 */
export interface BubblePlayerData {
  id?: string;
  appearsAt: number;
  question: string;
  type: 'MCQ' | 'TRUE_FALSE';
  options: string[];
  correctAnswer: number; // Index of correct answer
  explanation: string;
  // Optional fields for frontend state
  source_id?: string;
  answered?: boolean;
  userAnswer?: number;
}

/**
 * Video data for player component
 */
export interface VideoPlayerData {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  heygenVideoId?: string;
  duration?: number; // Duration in seconds
  transcript?: string;
  bubbles?: BubblePlayerData[];
}

// ============================================
// QUIZ PLAYER TYPES
// ============================================

/**
 * Question data for quiz player
 * Based on QuizQuestion database model
 */
export interface QuestionPlayerData {
  id?: string;
  order?: number;
  type: 'FILL_BLANK' | 'MCQ' | 'TRUE_FALSE';
  question: string; // This is 'prompt' in database
  explanation?: string;
  // For MCQ
  options?: string[];
  correctAnswer?: number | boolean | string;
  // For FILL_BLANK
  acceptableAnswers?: string[];
  hint?: string;
}

/**
 * User answer tracking
 */
export interface UserAnswer {
  questionId?: string;
  selectedAnswer: string | number | boolean;
  isCorrect: boolean;
  timestamp?: number;
}

/**
 * Quiz completion data
 */
export interface QuizCompletionData {
  quizId: string;
  answers: UserAnswer[];
  score: number;
  totalQuestions: number;
  completedAt: Date | string;
}

// ============================================
// PODCAST PLAYER TYPES
// ============================================

/**
 * Podcast data for player
 */
export interface PodcastPlayerData {
  id: string;
  title?: string;
  thumbnailUrl?: string;
  audioFileUrl?: string;
  duration?: number; // Duration in seconds
  transcript?: string;
  segments?: any; // PodcastSegment[] from database
}

// ============================================
// INTERACTIVE PODCAST PLAYER TYPES
// ============================================

/**
 * Word with timing for interactive podcast
 */
export interface InteractiveWordPlayerData {
  text: string;
  start_time: number;
  end_time: number;
  isBlank?: boolean;
  correctAnswer?: string;
}

/**
 * Transcript segment for interactive podcast player
 */
export interface TranscriptSegmentPlayerData {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  words?: InteractiveWordPlayerData[];
  wordsBeforeInteractive?: InteractiveWordPlayerData[];
  wordsAfterInteractive?: InteractiveWordPlayerData[];
  keywords?: string[];
  interactive?: {
    triggerTime: number;
    type: 'fill-blank';
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  };
}

/**
 * Interactive podcast data for player
 */
export interface InteractivePodcastPlayerData {
  podcastId: string;
  title: string;
  thumbnailUrl?: string;
  audioFile: string;
  duration: number;
  segments: TranscriptSegmentPlayerData[];
}

// ============================================
// GENERIC MEDIA TYPES
// ============================================

/**
 * Generic media type for unified handling in catalog/widget
 */
export interface MediaItem {
  id: string;
  title: string;
  thumbnailUrl?: string;
  type: 'video' | 'article' | 'podcast' | 'quiz' | 'interactive-podcast';
  duration?: number; // For video/podcast
  category?: string;
}

// Type guards for player data
export function isVideoPlayerData(media: any): media is VideoPlayerData {
  return 'videoUrl' in media;
}

export function isPodcastPlayerData(media: any): media is PodcastPlayerData {
  return 'audioFileUrl' in media && !('segments' in media && Array.isArray(media.segments));
}

export function isInteractivePodcastPlayerData(
  media: any
): media is InteractivePodcastPlayerData {
  return 'segments' in media && Array.isArray(media.segments);
}
