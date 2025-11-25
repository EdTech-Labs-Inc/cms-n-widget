'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import './PodcastCompletionModal.css'

interface PodcastCompletionModalProps {
    isOpen: boolean
    onClose: () => void
    score: number
    totalPrompts: number
}

function PodcastCompletionModal({ isOpen, onClose, score, totalPrompts }: PodcastCompletionModalProps) {
    const router = useRouter()

    // Create audio element for lesson complete sound
    const lessonCompleteAudio = '/assets/lesson_complete.mp3'
    const lessonCompleteSound = useMemo(() => new Audio(lessonCompleteAudio), [])
    
    const scorePercentage = Math.round((score / totalPrompts) * 100)
    const isExcellent = scorePercentage >= 80
    const isGood = scorePercentage >= 60

    // Play lesson complete sound when modal opens
    useEffect(() => {
        if (isOpen) {
            try {
                lessonCompleteSound.currentTime = 0 // Reset to start
                lessonCompleteSound.play()
            } catch (error) {
                console.warn('Could not play lesson complete audio:', error)
            }
        }
    }, [isOpen, lessonCompleteSound])
    
    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { duration: 0.3, ease: "easeOut" as const }
        }
    }

    const modalVariants = {
        hidden: { 
            opacity: 0, 
            scale: 0.8, 
            y: 50,
            rotate: -2
        },
        visible: { 
            opacity: 1, 
            scale: 1, 
            y: 0,
            rotate: 0,
            transition: { 
                duration: 0.5, 
                ease: [0.22, 1, 0.36, 1] as const,
                type: "spring" as const,
                damping: 25,
                stiffness: 300
            } 
        },
        exit: {
            opacity: 0,
            scale: 0.9,
            y: 20,
            transition: { duration: 0.2, ease: "easeIn" as const }
        }
    }

    const contentVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
                delay: 0.2,
                duration: 0.4,
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.3 }
        }
    }

    const celebrationVariants = {
        hidden: { scale: 0, rotate: -180 },
        visible: { 
            scale: 1, 
            rotate: 0,
            transition: { 
                delay: 0.1,
                duration: 0.6,
                ease: "backOut" as const
            }
        }
    }

    const pulseVariants = {
        pulse: {
            scale: [1, 1.1, 1],
            transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut" as const
            }
        }
    }

    const handleNavigateToHub = () => {
        onClose()
        router.push('/')
    }

    const getCelebrationEmoji = () => {
        if (isExcellent) return '🏆'
        if (isGood) return '🎉'
        return '👏'
    }

    const getCelebrationTitle = () => {
        if (isExcellent) return 'Outstanding Work!'
        if (isGood) return 'Great Job!'
        return 'Podcast Complete!'
    }

    const getCelebrationMessage = () => {
        if (isExcellent) return "You've mastered this financial topic! Your understanding is excellent."
        if (isGood) return "You're building solid financial knowledge! Keep up the great work."
        return "You've completed your learning session! Every step forward counts."
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="podcast-completion-modal-overlay"
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    onClick={onClose}
                >
                    <motion.div
                        className="podcast-completion-modal"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                    >
                        <motion.div
                            className="podcast-completion-modal-content"
                            variants={contentVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div 
                                className="completion-icon-container"
                                variants={celebrationVariants}
                                animate="pulse"
                                whileHover="pulse"
                            >
                                <motion.span 
                                    className="completion-celebration-icon"
                                    variants={pulseVariants}
                                    animate="pulse"
                                >
                                    {getCelebrationEmoji()}
                                </motion.span>
                                <motion.div 
                                    className="completion-score"
                                    variants={itemVariants}
                                >
                                    <span className="score-text">{score}/{totalPrompts}</span>
                                    <span className="score-percentage">{scorePercentage}%</span>
                                </motion.div>
                            </motion.div>

                            <motion.h2 
                                className="completion-title"
                                variants={itemVariants}
                            >
                                {getCelebrationTitle()}
                            </motion.h2>

                            <motion.div 
                                className="completion-description"
                                variants={itemVariants}
                            >
                                <p className="completion-message">
                                    {getCelebrationMessage()}
                                </p>
                                <p>
                                    You've successfully engaged with all the interactive elements in this podcast. 
                                    Your financial literacy journey is gaining momentum!
                                </p>
                                <div className="completion-stats">
                                    <div className="stat-item">
                                        <span className="stat-number">{score}</span>
                                        <span className="stat-label">Correct Answers</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-number">{totalPrompts}</span>
                                        <span className="stat-label">Total Questions</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-number">{scorePercentage}%</span>
                                        <span className="stat-label">Accuracy</span>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="completion-actions"
                                variants={itemVariants}
                            >
                                <motion.button
                                    className="completion-hub-button"
                                    variants={itemVariants}
                                    whileHover={{ 
                                        scale: 1.05,
                                        boxShadow: "0 8px 20px rgba(223, 159, 57, 0.4)"
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleNavigateToHub}
                                >
                                    Continue Learning 🚀
                                </motion.button>
                            </motion.div>

                            <motion.p 
                                className="completion-reminder"
                                variants={itemVariants}
                            >
                                🎯 Keep building your financial knowledge one podcast at a time
                            </motion.p>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default PodcastCompletionModal