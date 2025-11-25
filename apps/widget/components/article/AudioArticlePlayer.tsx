'use client'

import { useEffect, useRef, useState } from 'react'
import './AudioArticlePlayer.css'

interface AudioArticlePlayerProps {
  audioUrl: string
}

function AudioArticlePlayer({ audioUrl }: AudioArticlePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Cleanup audio on unmount (handles back press)
  useEffect(() => {
    const audio = audioRef.current
    return () => {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    }
  }, [])

  const togglePlayPause = () => {
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

  // Handle when audio ends
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => setIsPlaying(false)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  return (
    <div className="audio-article-player">
      <audio ref={audioRef} src={audioUrl} />

      <div className="audio-player-content">
        <span className="audio-player-label">🎧 Listen to this article</span>
        <button
          className={`audio-toggle-button ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlayPause}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isPlaying ? (
            <div className="pause-icon">
              <span></span>
              <span></span>
            </div>
          ) : (
            <div className="play-icon"></div>
          )}
        </button>
      </div>
    </div>
  )
}

export default AudioArticlePlayer
