import { useState, useEffect } from 'react'
import { getCompletionData } from '@/utils/completionTracker'

export function useContentCompletion(contentId: string) {
  const [completionInfo, setCompletionInfo] = useState<{
    completed: boolean
    xpEarned: number
  } | null>(null)

  useEffect(() => {
    const data = getCompletionData(contentId)
    if (data) {
      setCompletionInfo({
        completed: true,
        xpEarned: data.xpEarned,
      })
    } else {
      setCompletionInfo({
        completed: false,
        xpEarned: 0,
      })
    }
  }, [contentId])

  return completionInfo
}
