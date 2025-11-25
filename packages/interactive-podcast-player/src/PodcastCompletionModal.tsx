'use client'

import { useEffect, useMemo } from 'react'
import './PodcastCompletionModal.css'

interface PodcastCompletionModalProps {
    isOpen: boolean
    onClose: () => void
    score: number
    totalPrompts: number
    onContinue?: () => void
}

function PodcastCompletionModal({ isOpen, onClose, score, totalPrompts, onContinue }: PodcastCompletionModalProps) {
    // Create audio element for lesson complete sound - using relative path from assets
    const lessonCompleteAudio = new URL('../assets/lesson_complete.mp3', import.meta.url).href
    const lessonCompleteSound = useMemo(() => new Audio(lessonCompleteAudio), [lessonCompleteAudio])

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

    const handleContinue = () => {
        onClose()
        if (onContinue) {
            onContinue()
        }
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

    if (!isOpen) return null

    return (
        <div
            className="podcast-completion-modal-overlay"
            onClick={onClose}
        >
            <div
                className="podcast-completion-modal"
                onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
                <div className="podcast-completion-modal-content">
                    <div className="completion-icon-container">
                        <span className="completion-celebration-icon">
                            {getCelebrationEmoji()}
                        </span>
                        <div className="completion-score">
                            <span className="score-text">{score}/{totalPrompts}</span>
                            <span className="score-percentage">{scorePercentage}%</span>
                        </div>
                    </div>

                    <h2 className="completion-title">
                        {getCelebrationTitle()}
                    </h2>

                    <div className="completion-description">
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
                    </div>

                    <div className="completion-actions">
                        <button
                            className="completion-hub-button"
                            onClick={handleContinue}
                        >
                            Continue Learning 🚀
                        </button>
                    </div>

                    <p className="completion-reminder">
                        🎯 Keep building your financial knowledge one podcast at a time
                    </p>
                </div>
            </div>
        </div>
    )
}

export default PodcastCompletionModal
