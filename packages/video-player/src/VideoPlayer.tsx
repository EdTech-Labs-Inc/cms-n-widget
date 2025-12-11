'use client'

import { useState, useRef, useEffect } from 'react'
import {
  PlayIcon,
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  BookmarkIcon,
  ShareIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import {
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon,
  CheckCircleIcon as CheckCircleSolidIcon
} from '@heroicons/react/24/solid'
import BubbleOverlay from './overlays/BubbleOverlay'
import type { Bubble, Video } from './types'
import './VideoPlayer.css'

interface VideoPlayerProps {
  video: Video
  bubbles?: Bubble[]
  isActive?: boolean
  autoPlay?: boolean
  showSidebar?: boolean
  showControls?: boolean
  onComplete?: (videoId: string) => void
  onLike?: (videoId: string) => void
  onBookmark?: (videoId: string) => void
  onShare?: (videoId: string) => void
  onBubbleAnswer?: (bubbleId: string, isCorrect: boolean) => void
  correctSoundUrl?: string
  incorrectSoundUrl?: string
}

function VideoPlayer({
  video,
  bubbles = [],
  isActive = true,
  autoPlay = true,
  showSidebar = true,
  showControls = true,
  onComplete,
  onLike,
  onBookmark,
  onShare,
  onBubbleAnswer,
  correctSoundUrl,
  incorrectSoundUrl
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [buffered, setBuffered] = useState(0)

  // Local interaction states
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  // Bubble overlay states
  const [activeBubble, setActiveBubble] = useState<Bubble | null>(null)
  const [wasPlayingBeforeBubble, setWasPlayingBeforeBubble] = useState(false)
  const [unseenBubbles, setUnseenBubbles] = useState<Bubble[]>([])
  const [bubblesInitialized, setBubblesInitialized] = useState(false)
  const [allVideoBubbles, setAllVideoBubbles] = useState<Bubble[]>([])
  const [previousTimeMs, setPreviousTimeMs] = useState(0)
  const [bubbleQueue, setBubbleQueue] = useState<Bubble[]>([])
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)
  const [metadataLoaded, setMetadataLoaded] = useState(false)



  useEffect(() => {
    if (videoRef.current) {
      if (isActive && isPlaying) {
        const playPromise = videoRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('Auto-play failed:', error)
          })
        }
      } else {
        videoRef.current.pause()
      }
    }
  }, [isActive, isPlaying])

  useEffect(() => {
    // Auto-play when video becomes active
    if (isActive && autoPlay) {
      setIsPlaying(true)
    } else {
      setIsPlaying(false)
    }
  }, [isActive, autoPlay])

  // Initialize unseen bubbles when video becomes active
  useEffect(() => {
    if (isActive && !bubblesInitialized) {
      const videoBubbles = (bubbles || video.bubbles || []).sort((a, b) => a.appearsAt - b.appearsAt)

      setAllVideoBubbles(videoBubbles)
      setUnseenBubbles(videoBubbles)
      setBubblesInitialized(true)
      setPreviousTimeMs(0)
    } else if (!isActive) {
      // Reset when video becomes inactive
      setBubblesInitialized(false)
      setUnseenBubbles([])
      setAllVideoBubbles([])
      setPreviousTimeMs(0)
      setBubbleQueue([])
      setIsProcessingQueue(false)
      setIsCompleted(false)
      setMetadataLoaded(false)
    }
  }, [isActive, video, bubbles, bubblesInitialized])

  // Process bubble queue sequentially
  useEffect(() => {
    if (bubbleQueue.length > 0 && !activeBubble && !isProcessingQueue) {
      setIsProcessingQueue(true)
      const nextBubble = bubbleQueue[0]

      setWasPlayingBeforeBubble(isPlaying)
      setIsPlaying(false)
      setActiveBubble(nextBubble)

      // Remove from unseen bubbles and queue using appearsAt as unique identifier
      setUnseenBubbles(prev => prev.filter(b => b.appearsAt !== nextBubble.appearsAt))
      setBubbleQueue(prev => prev.slice(1))
    } else if (bubbleQueue.length === 0) {
      setIsProcessingQueue(false)
    }
  }, [bubbleQueue, activeBubble, isProcessingQueue, isPlaying])

  const handleVideoTap = () => {
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTimeMs = videoRef.current.currentTime * 1000 // Convert to milliseconds
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100
      setProgress(progress)

      // Detect time skip (jump forward by more than 1 second)
      const timeSkipped = currentTimeMs - previousTimeMs > 1500 && previousTimeMs > 0

      if (!activeBubble && isActive && unseenBubbles.length > 0) {
        if (timeSkipped) {
          // Handle time skip: find all bubbles that should have been shown between previous and current time
          const skippedBubbles = unseenBubbles.filter(bubble =>
            bubble.appearsAt >= previousTimeMs && bubble.appearsAt <= currentTimeMs
          )

          if (skippedBubbles.length > 0) {
            setBubbleQueue(prev => [...prev, ...skippedBubbles])
          }
        } else {
          // Normal time progression: check for next bubble
          const nextBubble = unseenBubbles[0] // First bubble in sorted list

          // Show bubble if current time has reached its appearsAt time
          if (currentTimeMs >= nextBubble.appearsAt) {
            setWasPlayingBeforeBubble(isPlaying)
            setIsPlaying(false) // Pause video
            setActiveBubble(nextBubble)

            // Remove the triggered bubble from unseen list
            setUnseenBubbles(prev => prev.slice(1))
          }
        }
      }

      setPreviousTimeMs(currentTimeMs)
    }
  }

  const handleProgress = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1)
      const duration = videoRef.current.duration
      setBuffered((bufferedEnd / duration) * 100)
    }
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value)
    setProgress(newProgress)
    if (videoRef.current) {
      videoRef.current.currentTime = (newProgress / 100) * videoRef.current.duration
    }
  }

  const handleProgressInput = (e: React.FormEvent<HTMLInputElement>) => {
    const newProgress = parseFloat((e.target as HTMLInputElement).value)
    setProgress(newProgress)
    if (videoRef.current) {
      videoRef.current.currentTime = (newProgress / 100) * videoRef.current.duration
    }
  }

  const handleVideoEnded = () => {
    // Loop the video by resetting to beginning
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      setProgress(0)
      setIsPlaying(true)

      // Reset bubble states for replay
      const videoBubbles = (bubbles || video.bubbles || []).sort((a, b) => a.appearsAt - b.appearsAt)

      setAllVideoBubbles(videoBubbles)
      setUnseenBubbles(videoBubbles)
      setPreviousTimeMs(0)
      setBubbleQueue([])
      setIsProcessingQueue(false)
    }

    // Mark as completed if not already
    if (!isCompleted) {
      setIsCompleted(true)
      if (onComplete) {
        onComplete(video.id)
      }
    }
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    if (onLike) {
      onLike(video.id)
    }
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    if (onBookmark) {
      onBookmark(video.id)
    }
  }

  // Bubble overlay handlers
  const handleBubbleClose = () => {
    setActiveBubble(null)
    // Resume video if it was playing before and no more bubbles in queue
    if (wasPlayingBeforeBubble && bubbleQueue.length === 0) {
      setIsPlaying(true)
    }
  }

  const handleBubbleCorrect = () => {
    console.log('[VideoPlayer] Bubble answered correctly!')
    if (activeBubble && onBubbleAnswer) {
      const bubbleId = activeBubble.id || `bubble-${activeBubble.question}`
      onBubbleAnswer(bubbleId, true)
    }
  }

  const handleBubbleIncorrect = () => {
    console.log('[VideoPlayer] Bubble answered incorrectly!')
    if (activeBubble && onBubbleAnswer) {
      const bubbleId = activeBubble.id || `bubble-${activeBubble.question}`
      onBubbleAnswer(bubbleId, false)
    }
  }

  return (
    <div className="vs-player">
      <video
        ref={videoRef}
        className="vs-player__video"
        src={video.videoUrl}
        poster={video.thumbnailUrl}
        playsInline
        controls={false}
        muted={false}
        autoPlay={isActive && autoPlay}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onEnded={handleVideoEnded}
        onLoadedMetadata={() => setMetadataLoaded(true)}
        onClick={handleVideoTap}
        style={{
          objectFit: 'contain',
          width: '100%',
          height: '100%'
        }}
      />

      {/* Play icon overlay - visible when paused */}
      <div
        className={`vs-player__play-overlay ${!isPlaying ? 'vs-player__play-overlay--visible' : ''}`}
        onClick={handleVideoTap}
      >
        <PlayIcon className="vs-player__play-icon" />
      </div>

      {/* Icon sidebar */}
      {showSidebar && (
        <div className="vs-player__sidebar">
          <div
            className={`vs-player__icon-btn vs-player__icon-btn--readonly ${isCompleted ? 'vs-player__icon-btn--active vs-player__icon-btn--completed' : ''}`}
          >
            {isCompleted ? <CheckCircleSolidIcon /> : <CheckCircleIcon />}
          </div>

          {onLike && (
            <button
              className={`vs-player__icon-btn ${isLiked ? 'vs-player__icon-btn--active vs-player__icon-btn--liked' : ''}`}
              onClick={handleLike}
            >
              {isLiked ? <HeartSolidIcon /> : <HeartIcon />}
            </button>
          )}

          {onBookmark && (
            <button
              className={`vs-player__icon-btn ${isBookmarked ? 'vs-player__icon-btn--active vs-player__icon-btn--bookmarked' : ''}`}
              onClick={handleBookmark}
            >
              {isBookmarked ? <BookmarkSolidIcon /> : <BookmarkIcon />}
            </button>
          )}

          <button className="vs-player__icon-btn">
            <ChatBubbleOvalLeftIcon />
          </button>

          {onShare && (
            <button className="vs-player__icon-btn" onClick={() => onShare(video.id)}>
              <ShareIcon />
            </button>
          )}
        </div>
      )}

      {/* Bottom controls */}
      {showControls && metadataLoaded && (
        <div className="vs-player__controls">
          <h3 className="vs-player__title">{video.title}</h3>
          <div className="vs-player__progress-container">
            <div className="vs-player__progress-track" />
            <div className="vs-player__progress-buffered" style={{ width: `${buffered}%` }} />
            <div className="vs-player__progress-filled" style={{ width: `${progress}%` }} />

            {/* Bubble indicators */}
            {videoRef.current?.duration && allVideoBubbles.map(bubble => {
              const bubblePosition = (bubble.appearsAt / 1000) / (videoRef.current?.duration || 1) * 100
              return (
                <div
                  key={bubble.id || bubble.appearsAt}
                  className="vs-player__bubble-indicator"
                  style={{ left: `${bubblePosition}%` }}
                  title={`Bubble at ${Math.floor(bubble.appearsAt / 1000)}s`}
                />
              )
            })}

            <input
              type="range"
              className="vs-player__progress-slider"
              min="0"
              max="100"
              value={isNaN(progress) ? 0 : progress}
              onChange={handleProgressChange}
              onInput={handleProgressInput}
            />
          </div>
        </div>
      )}

      {/* Bubble Overlay */}
      {activeBubble && (
        <BubbleOverlay
          bubble={activeBubble}
          onClose={handleBubbleClose}
          onCorrect={handleBubbleCorrect}
          onIncorrect={handleBubbleIncorrect}
          correctSoundUrl={correctSoundUrl}
          incorrectSoundUrl={incorrectSoundUrl}
        />
      )}
    </div>
  )
}

export default VideoPlayer
