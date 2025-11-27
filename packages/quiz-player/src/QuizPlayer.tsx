'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import type { Question, UserAnswer } from './types'
import './QuizPlayer.css'

interface QuizPlayerProps {
  questions: Question[]
  onClose?: () => void
  showCloseButton?: boolean
  disableOverlay?: boolean
}

function QuizPlayer({ questions, onClose, showCloseButton = true, disableOverlay = false }: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<number, UserAnswer>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = userAnswers[currentQuestionIndex]
  const totalQuestions = questions.length
  const score = Object.values(userAnswers).filter(answer => answer.isCorrect).length

  // Check if quiz is completed
  useEffect(() => {
    if (Object.keys(userAnswers).length === questions.length) {
      setIsCompleted(true)
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
    }
  }, [userAnswers, questions.length])

  const handleAnswerSelect = (selectedAnswer: string | number | boolean) => {
    if (currentAnswer) return // Already answered

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer

    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: { selectedAnswer, isCorrect }
    }))

    // Show explanation by default if answer is incorrect, hide if correct
    setShowExplanation(!isCorrect)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setShowExplanation(false)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setShowExplanation(false)
    }
  }

  const getScorePercentage = () => {
    return Math.round((score / totalQuestions) * 100)
  }

  const getCompletionTitle = () => {
    const percentage = getScorePercentage()
    if (percentage >= 80) return 'Outstanding Work!'
    if (percentage >= 60) return 'Great Job!'
    return 'Quiz Complete!'
  }

  const getCompletionEmoji = () => {
    const percentage = getScorePercentage()
    if (percentage >= 80) return '🏆'
    if (percentage >= 60) return '🎉'
    return '👏'
  }

  const getCompletionMessage = () => {
    const percentage = getScorePercentage()
    if (percentage >= 80) return "You've shown excellent understanding of this topic!"
    if (percentage >= 60) return "You're building solid knowledge! Keep up the great work."
    return "You've completed the quiz! Every step forward counts."
  }

  const renderQuestionContent = () => {
    if (!currentQuestion) return null

    switch (currentQuestion.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <div className="quiz-options">
            {currentQuestion.options?.map((option: string, index: number) => {
              const isSelected = currentAnswer?.selectedAnswer === index
              const isCorrect = index === currentQuestion.correctAnswer
              const showCorrectAnswer = currentAnswer && !currentAnswer.isCorrect && isCorrect

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={!!currentAnswer}
                  className={`quiz-option ${
                    isSelected
                      ? currentAnswer.isCorrect
                        ? 'correct'
                        : 'incorrect'
                      : ''
                  } ${showCorrectAnswer ? 'show-correct' : ''}`}
                >
                  {option}
                </button>
              )
            })}
          </div>
        )

      case 'TRUE_FALSE':
        return (
          <div className="quiz-options">
            {[true, false].map((value) => {
              const isSelected = currentAnswer?.selectedAnswer === value
              const isCorrect = value === currentQuestion.correctAnswer
              const showCorrectAnswer = currentAnswer && !currentAnswer.isCorrect && isCorrect

              return (
                <button
                  key={value.toString()}
                  onClick={() => handleAnswerSelect(value)}
                  disabled={!!currentAnswer}
                  className={`quiz-option ${
                    isSelected
                      ? currentAnswer.isCorrect
                        ? 'correct'
                        : 'incorrect'
                      : ''
                  } ${showCorrectAnswer ? 'show-correct' : ''}`}
                >
                  {value ? 'True' : 'False'}
                </button>
              )
            })}
          </div>
        )

      case 'FILL_BLANK':
        const userInput = currentAnswer?.selectedAnswer as string || ''
        const isAnswered = !!currentAnswer

        return (
          <div className="quiz-input-container">
            <input
              type="text"
              value={isAnswered ? userInput : ''}
              onChange={(e) => {
                if (!isAnswered) {
                  // Allow typing but don't submit yet
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isAnswered) {
                  const value = (e.target as HTMLInputElement).value.trim()
                  if (value) {
                    // correctAnswer can be a string or array of acceptable answers
                    const correctAnswer = currentQuestion.correctAnswer
                    const acceptable = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]
                    const isCorrect = acceptable.some(
                      answer => String(answer).toLowerCase() === value.toLowerCase()
                    )
                    handleAnswerSelect(value)
                  }
                }
              }}
              disabled={isAnswered}
              className={`quiz-input ${
                isAnswered
                  ? currentAnswer.isCorrect
                    ? 'correct'
                    : 'incorrect'
                  : ''
              }`}
              placeholder="Type your answer and press Enter"
            />
            {isAnswered && !currentAnswer.isCorrect && (
              <p className="correct-answer-hint">
                Correct answer: {currentQuestion.correctAnswer}
              </p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const wrapWithModal = (content: React.ReactNode) => {
    if (disableOverlay) {
      return <div className="quiz-preview-mode">{content}</div>
    }
    return (
      <div className="quiz-modal-overlay">
        <div className="quiz-modal">{content}</div>
      </div>
    )
  }

  if (isCompleted && showCelebration) {
    return wrapWithModal(
      <div className="quiz-celebration">
        <div className="celebration-icon">{getCompletionEmoji()}</div>
        <h2>Quiz Complete!</h2>
      </div>
    )
  }

  if (isCompleted) {
    return wrapWithModal(
      <>
        {showCloseButton && onClose && (
          <button onClick={onClose} className="quiz-close-button" aria-label="Close quiz">
            <XMarkIcon className="w-6 h-6" />
          </button>
        )}

        <div className="quiz-completion">
          <div className="completion-icon-large">{getCompletionEmoji()}</div>
          <h2 className="completion-title">{getCompletionTitle()}</h2>

          <div className="completion-score-display">
            <div className="score-circle">
              <span className="score-number">{score}</span>
              <span className="score-divider">/</span>
              <span className="score-total">{totalQuestions}</span>
            </div>
            <p className="score-percentage">{getScorePercentage()}%</p>
          </div>

          <p className="completion-message">{getCompletionMessage()}</p>

          <div className="completion-stats">
            <div className="stat-item">
              <span className="stat-value">{score}</span>
              <span className="stat-label">Correct</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{totalQuestions - score}</span>
              <span className="stat-label">Incorrect</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{getScorePercentage()}%</span>
              <span className="stat-label">Score</span>
            </div>
          </div>

          {onClose && (
            <button onClick={onClose} className="quiz-return-button">
              Return
            </button>
          )}
        </div>
      </>
    )
  }

  return wrapWithModal(
    <>
        {showCloseButton && onClose && (
          <button onClick={onClose} className="quiz-close-button" aria-label="Close quiz">
            <XMarkIcon className="w-6 h-6" />
          </button>
        )}

        <div className="quiz-header">
          <h2 className="quiz-title">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </h2>
          <div className="quiz-progress-bar">
            <div
              className="quiz-progress-fill"
              style={{
                width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`
              }}
            />
          </div>
        </div>

        <div className="quiz-content">
          <p className="quiz-question">{currentQuestion.prompt}</p>

          {renderQuestionContent()}

          {currentAnswer && currentQuestion.explanation && (
            <div className="quiz-explanation-container">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="quiz-explanation-toggle"
              >
                <span>Explanation</span>
                {showExplanation ? (
                  <ChevronUpIcon className="w-5 h-5" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5" />
                )}
              </button>

              {showExplanation && (
                <div className="quiz-explanation">
                  <p>{currentQuestion.explanation}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="quiz-navigation">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="quiz-nav-button"
          >
            Previous
          </button>

          {currentAnswer && currentQuestionIndex < questions.length - 1 && (
            <button onClick={handleNextQuestion} className="quiz-nav-button quiz-nav-next">
              Next Question
            </button>
          )}
        </div>
      </>
  )
}

export default QuizPlayer
