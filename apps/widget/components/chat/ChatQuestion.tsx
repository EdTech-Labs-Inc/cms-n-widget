'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import StreamText from './StreamText'
import type { Question } from '@/types'
import { shuffleObjectToArray } from '@/utils/arrayUtils'
import './ChatQuestion.css'


interface ChatQuestionProps {
  question: Question
  onAnswerSelect: (selectedKey: string, isCorrect: boolean, answerText: string) => void
  isAnswered?: boolean
  className?: string
}

function ChatQuestion({ 
  question, 
  onAnswerSelect, 
  isAnswered = false,
  className = '' 
}: ChatQuestionProps) {
  const [questionComplete, setQuestionComplete] = useState(false)
  const [flashingAnswer, setFlashingAnswer] = useState<{key: string, correct: boolean} | null>(null)
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firstAnswerRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    // Store current ref values for cleanup
    const flashTimeout = flashTimeoutRef
    const answerTimeout = answerTimeoutRef
    
    // Cleanup on unmount
    return () => {
      // Clean up timeouts
      if (flashTimeout.current) clearTimeout(flashTimeout.current)
      if (answerTimeout.current) clearTimeout(answerTimeout.current)
    }
  }, [])

  // Shuffle answers only when question changes
  const shuffledAnswers = useMemo(() => {
    if (question.type === 'FILL_BLANK') return []

    const options = question.options || []

    // For MCQ and TRUE_FALSE, create answer objects with indices
    return options.map((text, index) => ({
      key: String(index),
      text: text
    })).sort(() => Math.random() - 0.5) // Shuffle
  }, [question.options, question.type])

  // Focus first answer when questions appear
  useEffect(() => {
    if (questionComplete && firstAnswerRef.current && !isAnswered) {
      firstAnswerRef.current.focus()
    }
  }, [questionComplete, isAnswered])

  const handleAnswerClick = (selectedKey: string, answerText: string) => {
    if (isAnswered) return

    let isCorrect = false
    if (question.type === 'MCQ') {
      isCorrect = Number(selectedKey) === question.correctAnswer
    } else if (question.type === 'TRUE_FALSE') {
      // For TRUE_FALSE, options are typically ["True", "False"] and correctAnswer is boolean
      const selectedBoolean = selectedKey === '0' // Index 0 = True, 1 = False
      isCorrect = selectedBoolean === question.correctAnswer
    }

    // Clear any existing timeouts
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
    if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current)

    // Flash visual feedback
    setFlashingAnswer({ key: selectedKey, correct: isCorrect })
    flashTimeoutRef.current = setTimeout(() => {
      setFlashingAnswer(null)
    }, 600)

    // Call parent handler immediately with audio trigger
    onAnswerSelect(selectedKey, isCorrect, answerText)
  }

  return (
    <div className={`chat-question ${className}`}>
      {/* Question Text */}
      <div className="chat-question__question">
        <StreamText
          text={question.question}
          speed={30}
          onComplete={() => setQuestionComplete(true)}
          className="chat-question__question-text"
        />
      </div>

      {/* Answer Options - show only after question is complete */}
      {questionComplete && (
        <div className="chat-question__answers" role="group" aria-label="Answer options">
          {shuffledAnswers.map((answer, index) => {
            const isFlashing = flashingAnswer?.key === answer.key
            const flashClass = isFlashing 
              ? (flashingAnswer?.correct ? 'chat-question__answer--flash-correct' : 'chat-question__answer--flash-incorrect')
              : ''
            
            return (
              <button
                key={answer.key}
                ref={index === 0 ? firstAnswerRef : null}
                className={`chat-question__answer ${
                  isAnswered ? 'chat-question__answer--disabled' : ''
                } ${flashClass}`}
                onClick={() => handleAnswerClick(answer.key, answer.text)}
                disabled={isAnswered}
                tabIndex={isAnswered ? -1 : 0}
                onKeyPress={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isAnswered) {
                    e.preventDefault()
                    handleAnswerClick(answer.key, answer.text)
                  }
                }}
                aria-label={`Answer option: ${answer.text}`}
                aria-disabled={isAnswered}
              >
                {answer.text}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ChatQuestion