/**
 * Quiz Player Types
 * Updated to match normalized QuizQuestion schema from database
 */

/**
 * Question type enum - matches database QuestionType enum
 */
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK'

/**
 * Question interface - matches QuizQuestion model from database
 * Updated from old JSON-based structure to normalized table structure
 */
export interface Question {
  id: string
  quizOutputId: string
  order: number              // Position in quiz
  type: QuestionType         // MULTIPLE_CHOICE | TRUE_FALSE | FILL_BLANK
  prompt: string             // Question text (was 'question' in old schema)
  stem: string | null        // Optional extra context
  options: any               // JSON field: [{id, text}] for MCQ/fill-blank choices
  correctAnswer: any         // JSON field: string/array/map depending on type
  explanation: string | null
  createdAt?: Date
  updatedAt?: Date
}

/**
 * User answer tracking
 */
export interface UserAnswer {
  selectedAnswer: string | number | boolean
  isCorrect: boolean
}

/**
 * QuizOutput type - matches database model structure
 */
export interface QuizOutput {
  id: string
  submissionId: string
  status: string
  questions: Question[]      // Array of QuizQuestion objects, not JSON
  isApproved: boolean
  approvedAt: Date | null
  approvedBy: string | null
  createdAt: Date
  updatedAt: Date
}
