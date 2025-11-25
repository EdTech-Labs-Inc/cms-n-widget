'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import type { Question } from '@/types'
import './ArticleQuizModal.css'

interface ArticleQuizModalProps {
  questions: Question[]
  onClose: () => void
}

interface UserAnswer {
  selectedAnswer: string | number | boolean
  isCorrect: boolean
}

function ArticleQuizModal({ questions, onClose }: ArticleQuizModalProps) {
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
      setShowExplanation(false) // Reset explanation visibility for next question
    }
  }

  const toggleExplanation = () => {
    setShowExplanation(prev => !prev)
  }

  const renderQuestionContent = () => {
    if (currentQuestion.type === 'MCQ') {
      return (
        <div className="article-quiz-modal__answers">
          {currentQuestion.options?.map((option, index) => {
            const isSelected = currentAnswer?.selectedAnswer === index
            const isCorrect = currentAnswer?.isCorrect && isSelected
            const isIncorrect = currentAnswer && !currentAnswer.isCorrect && isSelected

            return (
              <button
                key={index}
                className={`article-quiz-modal__answer ${
                  isSelected ? 'article-quiz-modal__answer--selected' : ''
                } ${isCorrect ? 'article-quiz-modal__answer--correct' : ''} ${
                  isIncorrect ? 'article-quiz-modal__answer--incorrect' : ''
                }`}
                onClick={() => handleAnswerSelect(index)}
                disabled={!!currentAnswer}
              >
                {option}
              </button>
            )
          })}
        </div>
      )
    }

    if (currentQuestion.type === 'TRUE_FALSE') {
      return (
        <div className="article-quiz-modal__answers">
          {[true, false].map((value) => {
            const isSelected = currentAnswer?.selectedAnswer === value
            const isCorrect = currentAnswer?.isCorrect && isSelected
            const isIncorrect = currentAnswer && !currentAnswer.isCorrect && isSelected

            return (
              <button
                key={String(value)}
                className={`article-quiz-modal__answer ${
                  isSelected ? 'article-quiz-modal__answer--selected' : ''
                } ${isCorrect ? 'article-quiz-modal__answer--correct' : ''} ${
                  isIncorrect ? 'article-quiz-modal__answer--incorrect' : ''
                }`}
                onClick={() => handleAnswerSelect(value)}
                disabled={!!currentAnswer}
              >
                {value ? 'True' : 'False'}
              </button>
            )
          })}
        </div>
      )
    }

    if (currentQuestion.type === 'FILL_BLANK') {
      return (
        <div className="article-quiz-modal__fill-blank">
          <input
            type="text"
            className="article-quiz-modal__input"
            placeholder="Type your answer..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                const answer = e.currentTarget.value.trim()
                const acceptableAnswers = currentQuestion.acceptableAnswers || [
                  currentQuestion.correctAnswer as string
                ]
                const isCorrect = acceptableAnswers.some(
                  acceptable => acceptable.toLowerCase() === answer.toLowerCase()
                )
                handleAnswerSelect(answer)
              }
            }}
            disabled={!!currentAnswer}
          />
          {currentAnswer && (
            <div className={`article-quiz-modal__fill-blank-result ${
              currentAnswer.isCorrect ? 'article-quiz-modal__fill-blank-result--correct' : 'article-quiz-modal__fill-blank-result--incorrect'
            }`}>
              {currentAnswer.isCorrect ? '✓ Correct!' : `✗ Correct answer: ${currentQuestion.correctAnswer}`}
            </div>
          )}
        </div>
      )
    }

    return null
  }

  const renderCompletionScreen = () => {
    const scorePercentage = Math.round((score / totalQuestions) * 100)
    const isExcellent = scorePercentage >= 80
    const isGood = scorePercentage >= 60

    const getEmoji = () => {
      if (isExcellent) return '🏆'
      if (isGood) return '🎉'
      return '👏'
    }

    const getTitle = () => {
      if (isExcellent) return 'Outstanding Work!'
      if (isGood) return 'Great Job!'
      return 'Quiz Complete!'
    }

    const getMessage = () => {
      if (isExcellent) return "You've mastered this topic! Your understanding is excellent."
      if (isGood) return "You're building solid knowledge! Keep up the great work."
      return "You've completed the quiz! Every step forward counts."
    }

    return (
      <div className="article-quiz-modal__completion">
        {showCelebration && (
          <div className="article-quiz-modal__celebration">
            <div className="article-quiz-modal__celebration-content">
              Quiz Complete!
            </div>
          </div>
        )}

        <div className="article-quiz-modal__completion-icon">{getEmoji()}</div>
        <h2 className="article-quiz-modal__completion-title">{getTitle()}</h2>
        <p className="article-quiz-modal__completion-message">{getMessage()}</p>

        <div className="article-quiz-modal__completion-score">
          <div className="article-quiz-modal__score-circle">
            <span className="article-quiz-modal__score-number">{score}</span>
            <span className="article-quiz-modal__score-divider">/</span>
            <span className="article-quiz-modal__score-total">{totalQuestions}</span>
          </div>
          <div className="article-quiz-modal__score-percentage">{scorePercentage}%</div>
        </div>

        <button
          className="article-quiz-modal__return-btn"
          onClick={onClose}
        >
          Return to Article
        </button>
      </div>
    )
  }

  return (
    <div className="article-quiz-modal-overlay" onClick={onClose}>
      <div className="article-quiz-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          className="article-quiz-modal__close-btn"
          onClick={onClose}
          aria-label="Close quiz"
        >
          <XMarkIcon className="article-quiz-modal__close-icon" />
        </button>

        {isCompleted ? (
          renderCompletionScreen()
        ) : (
          <>
            {/* Question Counter */}
            <div className="article-quiz-modal__counter">
              {currentQuestionIndex + 1}/{totalQuestions}
            </div>

            {/* Question */}
            <div className="article-quiz-modal__question-box">
              <h2 className="article-quiz-modal__question">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Answers */}
            {renderQuestionContent()}

            {/* Explanation - show after answering */}
            {currentAnswer && currentQuestion.explanation && (
              <div className="article-quiz-modal__explanation-container">
                <button
                  className="article-quiz-modal__explanation-toggle"
                  onClick={toggleExplanation}
                >
                  <span>Explanation</span>
                  {showExplanation ? (
                    <ChevronUpIcon className="article-quiz-modal__explanation-icon" />
                  ) : (
                    <ChevronDownIcon className="article-quiz-modal__explanation-icon" />
                  )}
                </button>
                {showExplanation && (
                  <div className="article-quiz-modal__explanation-box">
                    <p className="article-quiz-modal__explanation">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Next Button - show after answering */}
            {currentAnswer && currentQuestionIndex < questions.length - 1 && (
              <button
                className="article-quiz-modal__next-btn"
                onClick={handleNextQuestion}
              >
                Next Question
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ArticleQuizModal
