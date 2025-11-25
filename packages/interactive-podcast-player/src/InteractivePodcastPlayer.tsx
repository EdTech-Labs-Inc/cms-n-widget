'use client'

import { useState, useRef, useEffect } from 'react'
import TranscriptDisplay from './TranscriptDisplay'
import PodcastCompletionModal from './PodcastCompletionModal'
import type { PodcastData } from './types'
import './InteractivePodcastPlayer.css'

interface InteractivePodcastPlayerProps {
  podcastData: PodcastData
  onBack?: () => void
  onComplete?: () => void
  onPromptAnswer?: (isCorrect: boolean) => void
  showBackButton?: boolean
  showHeader?: boolean
}

function InteractivePodcastPlayer({
  podcastData,
  onBack,
  onComplete,
  onPromptAnswer,
  showBackButton = true,
  showHeader = true
}: InteractivePodcastPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [completedPrompts, setCompletedPrompts] = useState<Set<number>>(new Set())
  const [score, setScore] = useState(0)
  const [totalPrompts, setTotalPrompts] = useState(0)
  const [isPausedForInteraction, setIsPausedForInteraction] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [allPromptsCompleted, setAllPromptsCompleted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const prompts = podcastData.segments.filter(s => s.interactive).length
    console.log('[InteractivePodcast] Total interactive prompts:', prompts)
    console.log('[InteractivePodcast] Segments:', podcastData.segments.length)
    console.log('[InteractivePodcast] Audio URL:', podcastData.audioFile)
    setTotalPrompts(prompts)
  }, [podcastData])



  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => {
      const newTime = audio.currentTime
      setCurrentTime(newTime)

      // Check if we've reached the end of a segment with unanswered interactions
      const segmentWithUnansweredInteraction = podcastData.segments.find(s =>
        s.interactive &&
        newTime >= s.endTime &&
        !completedPrompts.has(s.interactive.triggerTime) &&
        !isPausedForInteraction
      )

      if (segmentWithUnansweredInteraction && segmentWithUnansweredInteraction.interactive) {
        console.log('[InteractivePodcast] Pausing at segment end:', {
          currentTime: newTime,
          segmentEnd: segmentWithUnansweredInteraction.endTime,
          triggerTime: segmentWithUnansweredInteraction.interactive.triggerTime
        })
        audio.pause()
        setIsPlaying(false)
        setIsPausedForInteraction(true)
      }
    }

    const handleError = (e: Event) => {
      console.error('[InteractivePodcast] Audio error:', e)
      console.error('[InteractivePodcast] Audio element:', audio)
      if (audio) {
        console.error('[InteractivePodcast] Audio error code:', audio.error?.code)
        console.error('[InteractivePodcast] Audio error message:', audio.error?.message)
      }
    }

    const handleCanPlay = () => {
      console.log('[InteractivePodcast] Audio can play - duration:', audio.duration)
    }


    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)

      // Show completion modal if all prompts have been completed
      if (allPromptsCompleted) {
        setShowCompletionModal(true)
      }
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [podcastData, completedPrompts, isPausedForInteraction, allPromptsCompleted])

  const handleStartPlayback = () => {
    const audio = audioRef.current
    if (!audio) return

    setHasStarted(true)
    audio.play().then(() => {
      setIsPlaying(true)
    }).catch((error) => {
      console.error('Failed to start playback:', error)
      // Reset if playback fails
      setHasStarted(false)
    })
  }

  const togglePlayPause = () => {
    // Don't allow play/pause when paused for interaction
    if (isPausedForInteraction) return

    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
      setIsPlaying(true)
    }
  }


  const handlePromptAnswer = (isCorrect: boolean, triggerTime: number) => {
    if (isCorrect) {
      setScore(prev => prev + 1)
    }

    const newCompletedPrompts = new Set(completedPrompts).add(triggerTime)
    setCompletedPrompts(newCompletedPrompts)

    // Call the external callback if provided
    if (onPromptAnswer) {
      onPromptAnswer(isCorrect)
    }

    // Check if all prompts have been completed
    if (newCompletedPrompts.size === totalPrompts && totalPrompts > 0) {
      // Mark that all prompts are completed, but don't show modal yet
      // Wait for audio to finish naturally
      setAllPromptsCompleted(true)
    }

    // Resume playback after a brief delay to show feedback
    setTimeout(() => {
      setIsPausedForInteraction(false)
      const audio = audioRef.current
      if (audio && !audio.ended && audio.readyState >= 2) {
        audio.play().then(() => {
          setIsPlaying(true)
        }).catch((error) => {
          console.warn('Audio play failed:', error)
          // Try once more after a brief delay
          setTimeout(() => {
            if (audio && !audio.ended) {
              audio.play().then(() => setIsPlaying(true))
            }
          }, 100)
        })
      }
    }, 500) // Brief delay to show feedback before resuming
  }




  return (
    <div className="interactive-podcast-player">
      <audio
        ref={audioRef}
        src={podcastData.audioFile}
        preload="metadata"
      />


      <div className="podcast-content">
        {showHeader && (
          <div className="top-header">
            {showBackButton && onBack && (
              <button className="back-button" onClick={onBack} aria-label="Go back">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <div className="header-text">
              <h1 className="podcast-title">{podcastData.title}</h1>
              <p className="podcast-subtitle">Interactive Learning Experience</p>
            </div>
          </div>
        )}

        <div className="podcast-main">
          <TranscriptDisplay
            segments={podcastData.segments}
            currentTime={currentTime}
            isPlaying={isPlaying}
            onInteractiveAnswer={handlePromptAnswer}
            completedPrompts={completedPrompts}
            isPausedForInteraction={isPausedForInteraction}
          />
        </div>

        {/* Bottom Controls */}
        {hasStarted && totalPrompts > 0 && (
          <div className="bottom-left-progress">
            <div className="progress-circle">
              <svg className="progress-ring" width="72" height="72" viewBox="0 0 72 72">
                <circle
                  cx="36"
                  cy="36"
                  r="32"
                  stroke="#df9f39"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="201.06"
                  strokeDashoffset={201.06 * (1 - (score / totalPrompts))}
                  className="progress-stroke"
                />
              </svg>
              <div className="progress-text">
                <span className="progress-score">{score}</span>
                <span className="progress-divider">/{totalPrompts}</span>
              </div>
            </div>
          </div>
        )}

        {!hasStarted ? (
          <div className="start-interface">
            <div className="game-explanation">
              <p>During the podcast, interactive questions will appear. Select the correct option from the two choices presented to test your understanding!</p>
            </div>
            <button
              className="gold-start-button"
              onClick={handleStartPlayback}
            >
              Start
            </button>
          </div>
        ) : (
          <button
            className={`bottom-right-play-button ${isPausedForInteraction ? 'disabled-for-interaction' : ''}`}
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4H10V20H6V4ZM14 4H18V20H14V4Z" />
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5V19L19 12L8 5Z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Completion Modal */}
      <PodcastCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        score={score}
        totalPrompts={totalPrompts}
        onContinue={onComplete}
      />

    </div>
  )
}

export default InteractivePodcastPlayer
