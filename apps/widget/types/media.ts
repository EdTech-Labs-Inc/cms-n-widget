/**
 * Core media types used throughout the application
 */

// Video interface matching the database structure from VideoOutput.videos JSON
export interface Video {
  id: string
  title: string
  videoUrl: string
  thumbnailUrl: string
  heygenVideoId?: string
  duration?: number // Duration in seconds (from database)
  transcript?: string
  bubbles?: Bubble[] // Video quiz bubbles
}

// Question interface matching the database structure from QuizOutput.questions JSON
export interface Question {
  type: 'FILL_BLANK' | 'MCQ' | 'TRUE_FALSE'
  question: string
  explanation?: string

  // For MCQ
  options?: string[] // Array of answer options (for MCQ)
  correctAnswer?: number | boolean | string // Index for MCQ (0-based), boolean for TRUE_FALSE, string for FILL_BLANK

  // For FILL_BLANK
  acceptableAnswers?: string[] // Array of acceptable answers for fill-in-the-blank
}

// Bubble interface matching the database schema
// Bubbles are only MCQ or TRUE_FALSE types
export interface Bubble {
  // Core fields from database (VideoOutput.videos.bubbles)
  appearsAt: number
  question: string
  type: 'MCQ' | 'TRUE_FALSE'
  options: string[] // Array of answer options (2 options for TRUE_FALSE or MCQ)
  correctAnswer: number // Index of the correct answer (0-based) - for both MCQ and TRUE_FALSE
  explanation: string

  // Optional fields for frontend state management (not in DB)
  id?: string // Generated client-side if needed for tracking
  source_id?: string // For identifying which video this belongs to
}

// Article interface matching the database structure
export interface Article {
  id: string
  title: string
  thumbnailUrl?: string
  content?: string
  category?: string
}

// Podcast interface matching the database structure from PodcastOutput
export interface Podcast {
  id: string
  title?: string
  thumbnailUrl?: string
  audioFileUrl?: string
  duration?: number // Duration in seconds (from database)
  transcript?: string // Plain text transcript from database
  segments?: any // JSON segments from database: {speaker, text, audioUrl, startTime, endTime}
  wordTimings?: any // JSON word timings from database: {word, startTime, endTime}
}

// Generic media type for unified handling
export type Media = Video | Article | Podcast

// Helper type guards
export function isVideo(media: Media): media is Video {
  return 'videoUrl' in media
}

export function isArticle(media: Media): media is Article {
  return 'read_time' in media && !('audioFileUrl' in media)
}

export function isPodcast(media: Media): media is Podcast {
  return 'audioFileUrl' in media
}