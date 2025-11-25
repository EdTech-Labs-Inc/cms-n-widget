'use client'

import { useState, useEffect } from 'react'
import { ChatProvider } from '@/contexts/ChatContext'
import OnboardingQuiz from '@/components/onboarding/OnboardingQuiz'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [showQuiz, setShowQuiz] = useState(false)
  const [competencyLevel, setCompetencyLevel] = useState<'beginner' | 'intermediate' | 'advanced' | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const hasCompletedQuiz = localStorage.getItem('quiz_completed')
    const savedLevel = localStorage.getItem('competency_level') as 'beginner' | 'intermediate' | 'advanced' | null

    if (!hasCompletedQuiz) {
      setShowQuiz(true)
    } else {
      setCompetencyLevel(savedLevel)
    }
    setIsLoading(false)
  }, [])

  const handleQuizComplete = (level: 'beginner' | 'intermediate' | 'advanced') => {
    localStorage.setItem('quiz_completed', 'true')
    localStorage.setItem('competency_level', level)
    setCompetencyLevel(level)
    setShowQuiz(false)
  }

  if (isLoading) {
    return null
  }

  if (showQuiz) {
    return <OnboardingQuiz onComplete={handleQuizComplete} />
  }

  return (
    <ChatProvider>
      {children}
    </ChatProvider>
  )
}
