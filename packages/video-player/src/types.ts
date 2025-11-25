/**
 * Video Player Types
 * Updated to match normalized VideoBubble schema from database
 */

/**
 * Bubble type - matches VideoBubble model from database
 * Replaces the old JSON-based bubble structure
 */
export interface Bubble {
  id: string
  videoOutputId: string
  appearsAt: number        // Replaces 'timestamp' - in seconds or ms
  order: number | null     // Position if multiple bubbles at same time
  question: string
  options: any             // JSON field: [{id, text}] for MCQ
  correctAnswer: any       // JSON field: String/array/structured
  explanation: string | null
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Video type - updated to use Bubble array instead of JSON
 */
export interface Video {
  id: string
  title: string
  videoUrl: string
  thumbnailUrl: string
  heygenVideoId?: string
  duration?: number
  transcript?: string
  bubbles?: Bubble[]       // Array of VideoBubble objects, not JSON
}

/**
 * VideoOutput type - matches database model structure
 */
export interface VideoOutput {
  id: string
  submissionId: string
  status: string
  videoUrl: string | null
  heygenVideoId: string | null
  submagicProjectId: string | null
  script: string | null
  thumbnailUrl: string | null
  duration: number | null
  transcript: string | null
  bubbles: Bubble[]        // Array of VideoBubble objects, not JSON
  isApproved: boolean
  approvedAt: Date | null
  approvedBy: string | null
  createdAt: Date
  updatedAt: Date
}
