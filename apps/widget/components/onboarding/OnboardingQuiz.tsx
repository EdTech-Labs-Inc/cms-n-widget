'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import quizQuestions from '@/data/quizQuestions.json'
import './OnboardingQuiz.css'

interface QuizQuestion {
    id: string
    level: 'beginner' | 'intermediate' | 'advanced'
    question: string
    options: string[]
    correctAnswer: number
}

interface OnboardingQuizProps {
    onComplete: (level: 'beginner' | 'intermediate' | 'advanced') => void
}

function OnboardingQuiz({ onComplete }: OnboardingQuizProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [questionPath, setQuestionPath] = useState<QuizQuestion[]>([])
    const [answers, setAnswers] = useState<{ questionId: string; correct: boolean }[]>([])
    const [selectedOption, setSelectedOption] = useState<number | null>(null)
    const [isTransitioning, setIsTransitioning] = useState(false)

    // Initialize quiz with first intermediate question
    useEffect(() => {
        const intermediateQuestions = quizQuestions.filter(q => q.level === 'intermediate')
        setQuestionPath([intermediateQuestions[0] as QuizQuestion])
    }, [])

    const currentQuestion = questionPath[currentQuestionIndex]

    const determineCompetencyLevel = (
        currentAnswers: { questionId: string; correct: boolean }[]
    ): 'beginner' | 'intermediate' | 'advanced' | null => {
        if (currentAnswers.length === 0) return null

        const firstAnswer = currentAnswers[0]

        // After first question (intermediate)
        if (currentAnswers.length === 1) {
            return null // Need more data
        }

        const secondAnswer = currentAnswers[1]

        // After second question
        if (currentAnswers.length === 2) {
            if (firstAnswer.correct && secondAnswer.correct) {
                // Got intermediate and advanced correct
                return 'advanced'
            }
            // Need third question for other cases
            return null
        }

        // After third question or more
        if (currentAnswers.length >= 3) {
            if (firstAnswer.correct) {
                // First was intermediate (correct), second was advanced
                if (secondAnswer.correct) {
                    return 'advanced' // Should have been caught earlier
                } else {
                    // Got intermediate right, advanced wrong
                    return 'intermediate'
                }
            } else {
                // First was intermediate (incorrect), second was beginner
                const thirdAnswer = currentAnswers[2]
                if (secondAnswer.correct && thirdAnswer.correct) {
                    // Got beginner right, then intermediate right
                    return 'intermediate'
                } else if (secondAnswer.correct && !thirdAnswer.correct) {
                    // Got beginner right, intermediate wrong
                    return 'beginner'
                } else if (!secondAnswer.correct) {
                    // Got beginner wrong
                    return 'beginner'
                }
            }
        }

        return null
    }

    const getNextQuestion = (wasCorrect: boolean): QuizQuestion | null => {
        const allAnswers = [...answers, { questionId: currentQuestion.id, correct: wasCorrect }]

        // Determine what level to ask next
        if (allAnswers.length === 1) {
            // After first intermediate question
            if (wasCorrect) {
                // Ask advanced
                const advancedQuestions = quizQuestions.filter(q => q.level === 'advanced')
                return advancedQuestions[0] as QuizQuestion
            } else {
                // Ask beginner
                const beginnerQuestions = quizQuestions.filter(q => q.level === 'beginner')
                return beginnerQuestions[0] as QuizQuestion
            }
        }

        if (allAnswers.length === 2) {
            const firstCorrect = allAnswers[0].correct

            if (firstCorrect && wasCorrect) {
                // Got intermediate and advanced correct - we're done
                return null
            }

            if (firstCorrect && !wasCorrect) {
                // Got intermediate correct, advanced wrong - ask another intermediate
                const intermediateQuestions = quizQuestions.filter(q => q.level === 'intermediate')
                return intermediateQuestions[1] as QuizQuestion
            }

            if (!firstCorrect && wasCorrect) {
                // Got intermediate wrong, beginner correct - ask intermediate
                const intermediateQuestions = quizQuestions.filter(q => q.level === 'intermediate')
                return intermediateQuestions[1] as QuizQuestion
            }

            if (!firstCorrect && !wasCorrect) {
                // Got intermediate wrong, beginner wrong - confirm with another beginner
                const beginnerQuestions = quizQuestions.filter(q => q.level === 'beginner')
                return beginnerQuestions[1] as QuizQuestion
            }
        }

        // After 3+ questions, we should be done
        return null
    }

    const handleOptionSelect = (optionIndex: number) => {
        if (isTransitioning) return
        setSelectedOption(optionIndex)

        // Wait a moment for visual feedback, then proceed
        setTimeout(() => {
            const wasCorrect = optionIndex === currentQuestion.correctAnswer
            const newAnswers = [...answers, { questionId: currentQuestion.id, correct: wasCorrect }]
            setAnswers(newAnswers)

            // Check if we can determine competency level
            const determinedLevel = determineCompetencyLevel(newAnswers)

            if (determinedLevel) {
                // We've determined the level - complete quiz
                setIsTransitioning(true)
                setTimeout(() => {
                    onComplete(determinedLevel)
                }, 600)
                return
            }

            // Get next question
            const nextQuestion = getNextQuestion(wasCorrect)

            if (nextQuestion) {
                setIsTransitioning(true)
                setTimeout(() => {
                    setQuestionPath([...questionPath, nextQuestion])
                    setCurrentQuestionIndex(currentQuestionIndex + 1)
                    setSelectedOption(null)
                    setIsTransitioning(false)
                }, 400)
            } else {
                // Fallback - shouldn't happen with good logic, but just in case
                const fallbackLevel = newAnswers[0].correct ? 'intermediate' : 'beginner'
                setTimeout(() => {
                    onComplete(fallbackLevel)
                }, 600)
            }
        }, 300)
    }

    if (!currentQuestion) {
        return null
    }

    return (
        <div className="onboarding-quiz-overlay">
            <motion.div
                className="onboarding-quiz-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="quiz-header">
                    <motion.h1
                        className="quiz-title"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        Let's personalize your learning journey
                    </motion.h1>
                    <motion.p
                        className="quiz-subtitle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        Answer a few questions so we can recommend the best content for you
                    </motion.p>
                </div>

                <div className="quiz-progress">
                    {[0, 1, 2].map((index) => (
                        <div
                            key={index}
                            className={`progress-dot ${index <= currentQuestionIndex ? 'active' : ''}`}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion.id}
                        className="quiz-question-card"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h2 className="question-text">{currentQuestion.question}</h2>

                        <div className="question-options">
                            {currentQuestion.options.map((option, index) => (
                                <motion.button
                                    key={index}
                                    className={`option-button ${selectedOption === index ? 'selected' : ''}`}
                                    onClick={() => handleOptionSelect(index)}
                                    disabled={selectedOption !== null}
                                    whileHover={selectedOption === null ? { scale: 1.02 } : {}}
                                    whileTap={selectedOption === null ? { scale: 0.98 } : {}}
                                >
                                    <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                                    <span className="option-text">{option}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
    )
}

export default OnboardingQuiz
