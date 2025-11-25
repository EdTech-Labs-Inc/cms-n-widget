/**
 * Completion Tracking System
 * Tracks completed videos and interactive podcasts with XP earned
 */

export type ContentType = 'video' | 'interactive-podcast'

export interface CompletionData {
  type: ContentType
  xpEarned: number
  timestamp: string
  allCorrect: boolean // Whether all interactive elements were answered correctly
}

export interface ContentProgress {
  bubbles?: { [bubbleId: string]: boolean } // Track individual bubble correctness
  quizAnswers?: { [questionIndex: number]: boolean } // Track quiz question correctness
  interactivePrompts?: { [promptIndex: number]: boolean } // Track podcast prompt correctness
}

const COMPLETION_STORAGE_KEY = 'completedContent'
const PROGRESS_STORAGE_KEY = 'contentProgress'

/**
 * Get all completed content from localStorage
 */
function getCompletedContent(): Record<string, CompletionData> {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const stored = localStorage.getItem(COMPLETION_STORAGE_KEY)
    if (!stored) {
      return {}
    }
    return JSON.parse(stored)
  } catch (error) {
    // Silent error handling for localStorage failures
    return {}
  }
}

/**
 * Get all content progress from localStorage
 */
function getContentProgress(): Record<string, ContentProgress> {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const stored = localStorage.getItem(PROGRESS_STORAGE_KEY)
    if (!stored) {
      return {}
    }
    return JSON.parse(stored)
  } catch (error) {
    // Silent error handling for localStorage failures
    return {}
  }
}

/**
 * Save completed content to localStorage
 */
function saveCompletedContent(data: Record<string, CompletionData>): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(COMPLETION_STORAGE_KEY, JSON.stringify(data))
  }
}

/**
 * Save content progress to localStorage
 */
function saveContentProgress(data: Record<string, ContentProgress>): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(data))
  }
}

/**
 * Check if content is completed
 */
export function isContentCompleted(contentId: string): boolean {
  const completed = getCompletedContent()
  return contentId in completed
}

/**
 * Get completion data for specific content
 */
export function getCompletionData(contentId: string): CompletionData | null {
  const completed = getCompletedContent()
  return completed[contentId] || null
}

/**
 * Mark content as completed
 */
export function markContentCompleted(
  contentId: string,
  type: ContentType,
  xpEarned: number,
  allCorrect: boolean = true
): void {
  const completed = getCompletedContent()

  // Don't overwrite if already completed
  if (completed[contentId]) {
    return
  }

  completed[contentId] = {
    type,
    xpEarned,
    timestamp: new Date().toISOString(),
    allCorrect,
  }

  saveCompletedContent(completed)
}

/**
 * Get progress for specific content
 */
export function getProgress(contentId: string): ContentProgress {
  const progress = getContentProgress()
  return progress[contentId] || {}
}

/**
 * Update bubble answer for content
 */
export function recordBubbleAnswer(
  contentId: string,
  bubbleId: string,
  isCorrect: boolean
): void {
  const progress = getContentProgress()

  if (!progress[contentId]) {
    progress[contentId] = {}
  }

  if (!progress[contentId].bubbles) {
    progress[contentId].bubbles = {}
  }

  progress[contentId].bubbles![bubbleId] = isCorrect
  saveContentProgress(progress)
}

/**
 * Update quiz answer for content
 */
export function recordQuizAnswer(
  contentId: string,
  questionIndex: number,
  isCorrect: boolean
): void {
  const progress = getContentProgress()

  if (!progress[contentId]) {
    progress[contentId] = {}
  }

  if (!progress[contentId].quizAnswers) {
    progress[contentId].quizAnswers = {}
  }

  progress[contentId].quizAnswers![questionIndex] = isCorrect
  saveContentProgress(progress)
}

/**
 * Update interactive prompt answer for podcasts
 */
export function recordInteractivePromptAnswer(
  contentId: string,
  promptIndex: number,
  isCorrect: boolean
): void {
  const progress = getContentProgress()

  if (!progress[contentId]) {
    progress[contentId] = {}
  }

  if (!progress[contentId].interactivePrompts) {
    progress[contentId].interactivePrompts = {}
  }

  progress[contentId].interactivePrompts![promptIndex] = isCorrect
  saveContentProgress(progress)
}

/**
 * Check if all bubbles in content were answered correctly
 */
export function areAllBubblesCorrect(contentId: string): boolean {
  const progress = getProgress(contentId)
  const bubbles = progress.bubbles

  if (!bubbles || Object.keys(bubbles).length === 0) {
    return true // No bubbles means nothing to get wrong
  }

  return Object.values(bubbles).every((isCorrect) => isCorrect)
}

/**
 * Check if all interactive prompts in podcast were answered correctly
 */
export function areAllPromptsCorrect(contentId: string): boolean {
  const progress = getProgress(contentId)
  const prompts = progress.interactivePrompts

  if (!prompts || Object.keys(prompts).length === 0) {
    return false // Interactive podcasts must have prompts
  }

  return Object.values(prompts).every((isCorrect) => isCorrect)
}

/**
 * Get count of correct answers
 */
export function getCorrectAnswersCount(contentId: string): {
  bubbles: number
  quizAnswers: number
  interactivePrompts: number
} {
  const progress = getProgress(contentId)

  const bubblesCount = progress.bubbles
    ? Object.values(progress.bubbles).filter((correct) => correct).length
    : 0

  const quizCount = progress.quizAnswers
    ? Object.values(progress.quizAnswers).filter((correct) => correct).length
    : 0

  const promptsCount = progress.interactivePrompts
    ? Object.values(progress.interactivePrompts).filter((correct) => correct).length
    : 0

  return {
    bubbles: bubblesCount,
    quizAnswers: quizCount,
    interactivePrompts: promptsCount,
  }
}

/**
 * Clear progress for specific content (e.g., when retrying)
 */
export function clearContentProgress(contentId: string): void {
  const progress = getContentProgress()
  delete progress[contentId]
  saveContentProgress(progress)
}

/**
 * Get all completed content IDs
 */
export function getAllCompletedContentIds(): string[] {
  const completed = getCompletedContent()
  return Object.keys(completed)
}

/**
 * Get stats about completed content
 */
export function getCompletionStats(): {
  totalCompleted: number
  videosCompleted: number
  podcastsCompleted: number
  totalXPEarned: number
} {
  const completed = getCompletedContent()
  const entries = Object.values(completed)

  return {
    totalCompleted: entries.length,
    videosCompleted: entries.filter((c) => c.type === 'video').length,
    podcastsCompleted: entries.filter((c) => c.type === 'interactive-podcast').length,
    totalXPEarned: entries.reduce((sum, c) => sum + c.xpEarned, 0),
  }
}

/**
 * Reset all completion data (for testing/debugging)
 */
export function resetCompletionData(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(COMPLETION_STORAGE_KEY)
    localStorage.removeItem(PROGRESS_STORAGE_KEY)
  }
}
