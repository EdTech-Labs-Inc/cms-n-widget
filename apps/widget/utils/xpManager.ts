/**
 * XP Management System
 * Handles experience points, leveling, and progress calculations
 */

export interface UserXPData {
  totalXP: number
  level: number
  lastUpdated: string
}

export interface XPRewards {
  VIDEO_COMPLETE: 200
  INTERACTIVE_PODCAST_COMPLETE: 100
  QUIZ_QUESTION_CORRECT: 5
}

export const XP_REWARDS: XPRewards = {
  VIDEO_COMPLETE: 200,
  INTERACTIVE_PODCAST_COMPLETE: 100,
  QUIZ_QUESTION_CORRECT: 5,
}

const XP_PER_LEVEL = 1000
const STORAGE_KEY = 'userXP'

/**
 * Initialize XP data if it doesn't exist
 */
function initializeXPData(): UserXPData {
  const defaultData: UserXPData = {
    totalXP: 0,
    level: 1,
    lastUpdated: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData))
  }

  return defaultData
}

/**
 * Get current XP data from localStorage
 */
export function getXPData(): UserXPData {
  if (typeof window === 'undefined') {
    return { totalXP: 0, level: 1, lastUpdated: new Date().toISOString() }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return initializeXPData()
    }

    const data = JSON.parse(stored) as UserXPData
    return data
  } catch (error) {
    // Silent error handling for localStorage failures
    return initializeXPData()
  }
}

/**
 * Calculate level from total XP
 */
export function calculateLevel(totalXP: number): number {
  return Math.floor(totalXP / XP_PER_LEVEL) + 1
}

/**
 * Get XP required for next level
 */
export function getXPForNextLevel(currentLevel: number): number {
  return currentLevel * XP_PER_LEVEL
}

/**
 * Get XP required for current level (starting point)
 */
export function getXPForCurrentLevel(currentLevel: number): number {
  return (currentLevel - 1) * XP_PER_LEVEL
}

/**
 * Get progress to next level as percentage (0-100)
 */
export function getProgressToNextLevel(totalXP: number): number {
  const currentLevel = calculateLevel(totalXP)
  const xpForCurrentLevel = getXPForCurrentLevel(currentLevel)
  const xpForNextLevel = getXPForNextLevel(currentLevel)
  const xpInCurrentLevel = totalXP - xpForCurrentLevel
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel

  const progress = (xpInCurrentLevel / xpNeededForLevel) * 100
  return Math.min(Math.max(progress, 0), 100)
}

/**
 * Get XP remaining until next level
 */
export function getXPToNextLevel(totalXP: number): number {
  const currentLevel = calculateLevel(totalXP)
  const xpForNextLevel = getXPForNextLevel(currentLevel)
  return xpForNextLevel - totalXP
}

/**
 * Add XP and update level accordingly
 * Returns the new XP data and whether a level up occurred
 */
export function addXP(amount: number): {
  newData: UserXPData
  leveledUp: boolean
  previousLevel: number
  newLevel: number
} {
  const currentData = getXPData()
  const previousLevel = currentData.level

  const newTotalXP = currentData.totalXP + amount
  const newLevel = calculateLevel(newTotalXP)

  const newData: UserXPData = {
    totalXP: newTotalXP,
    level: newLevel,
    lastUpdated: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
  }

  return {
    newData,
    leveledUp: newLevel > previousLevel,
    previousLevel,
    newLevel,
  }
}

/**
 * Get current level
 */
export function getCurrentLevel(): number {
  const data = getXPData()
  return data.level
}

/**
 * Get total XP
 */
export function getTotalXP(): number {
  const data = getXPData()
  return data.totalXP
}

/**
 * Reset XP data (for testing/debugging)
 */
export function resetXP(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
    initializeXPData()
  }
}

/**
 * Get level title based on level number
 */
export function getLevelTitle(level: number): string {
  if (level <= 1) return 'Beginner'
  if (level <= 3) return 'Learner'
  if (level <= 5) return 'Student'
  if (level <= 7) return 'Scholar'
  if (level <= 10) return 'Expert'
  if (level <= 15) return 'Master'
  if (level <= 20) return 'Guru'
  return 'Legend'
}
