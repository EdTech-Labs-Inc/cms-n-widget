/**
 * Fisher-Yates shuffle algorithm for randomizing array elements
 * @param array - The array to shuffle
 * @returns A new shuffled array (does not mutate the original)
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Shuffle an object's values into an array of key-value pairs
 * @param obj - Object with string keys and values
 * @returns Shuffled array of {key, value} pairs
 */
export function shuffleObjectToArray<T>(obj: Record<string, T>): Array<{ key: string; value: T }> {
  const entries = Object.entries(obj).map(([key, value]) => ({ key, value }))
  return fisherYatesShuffle(entries)
}