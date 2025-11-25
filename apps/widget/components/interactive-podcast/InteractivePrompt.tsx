'use client'

import { useState, useEffect } from 'react'
import './InteractivePrompt.css'

interface InteractivePromptData {
  triggerTime: number
  type: 'fill-blank'
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

interface InteractivePromptProps {
  prompt: InteractivePromptData
  onAnswer: (isCorrect: boolean) => void
  onContinue: () => void
}

function InteractivePrompt({ prompt, onAnswer, onContinue }: InteractivePromptProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  useEffect(() => {
    setSelectedAnswer(null)
    setShowFeedback(false)
    setShowExplanation(false)
  }, [prompt])

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer) return
    
    setSelectedAnswer(answer)
    const correct = answer === prompt.correctAnswer
    setIsCorrect(correct)
    setShowFeedback(true)
    onAnswer(correct)
    
    if (correct) {
      setTimeout(() => {
        setShowExplanation(true)
      }, 500)
    } else {
      setShowExplanation(true)
    }
  }

  const handleContinue = () => {
    onContinue()
  }

  const formatQuestion = (question: string) => {
    const parts = question.split('___')
    if (parts.length === 2) {
      return (
        <>
          {parts[0]}
          <span className="prompt-blank">______</span>
          {parts[1]}
        </>
      )
    }
    return question
  }

  return (
    <div className="interactive-prompt-overlay">
      <div className="interactive-prompt">
        <div className="prompt-header">
          <div className="prompt-badge">Interactive Challenge</div>
          {showFeedback && (
            <div className={`prompt-result ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect ? '✓ Correct!' : '✗ Not quite'}
            </div>
          )}
        </div>

        <div className="prompt-question">
          <h2>{formatQuestion(prompt.question)}</h2>
        </div>

        <div className="prompt-options">
          {prompt.options.map((option, index) => {
            const isSelected = selectedAnswer === option
            const isCorrectOption = option === prompt.correctAnswer
            const showAsCorrect = showFeedback && isCorrectOption
            const showAsIncorrect = showFeedback && isSelected && !isCorrectOption
            
            return (
              <button
                key={index}
                className={`prompt-option ${isSelected ? 'selected' : ''} ${showAsCorrect ? 'correct' : ''} ${showAsIncorrect ? 'incorrect' : ''}`}
                onClick={() => handleAnswerSelect(option)}
                disabled={!!selectedAnswer}
              >
                <span className="option-text">{option}</span>
                {showAsCorrect && <span className="option-indicator">✓</span>}
                {showAsIncorrect && <span className="option-indicator">✗</span>}
              </button>
            )
          })}
        </div>

        {showExplanation && (
          <div className="prompt-explanation">
            <p>{prompt.explanation}</p>
          </div>
        )}

        {showFeedback && (
          <button className="prompt-continue" onClick={handleContinue}>
            Continue Listening →
          </button>
        )}
      </div>
    </div>
  )
}

export default InteractivePrompt