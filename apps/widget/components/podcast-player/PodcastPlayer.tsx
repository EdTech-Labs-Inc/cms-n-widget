'use client'

import { useState, useRef, useEffect } from 'react'
import './PodcastPlayer.css'

interface PodcastPlayerProps {
  audioSrc: string
  title: string
  date: string
  duration: string
  thumbnail: string
  isActive: boolean
  onPlay: () => void
}

function PodcastPlayer({ 
  audioSrc, 
  title, 
  date, 
  duration, 
  thumbnail,
  isActive,
  onPlay
}: PodcastPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setTotalDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  useEffect(() => {
    if (!isActive && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }, [isActive])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      onPlay()
      audio.play()
      setIsPlaying(true)
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const clickedValue = (x / rect.width) * totalDuration
    audio.currentTime = clickedValue
    setCurrentTime(clickedValue)
  }

  const progressPercentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0

  return (
    <div className={`podcast-player ${isActive ? 'active' : ''}`}>
      <audio ref={audioRef} src={audioSrc} />
      
      <div className="podcast-player-item">
        <div className="podcast-player-icon">
          <div className="podcast-player-thumbnail">
            <img src={thumbnail} alt="Podcast thumbnail" className="podcast-player-image" />
          </div>
        </div>
        
        <div className="podcast-player-content">
          <h3 className="podcast-player-title">{title}</h3>
          <div className="podcast-player-meta">
            <span className="podcast-player-date">{date}</span>
            <span className="podcast-player-duration">
              {isActive && totalDuration > 0 
                ? `${formatTime(currentTime)} / ${formatTime(totalDuration)}`
                : duration
              }
            </span>
          </div>
          
          {isActive && (
            <div className="podcast-progress-container">
              <div 
                className="podcast-progress-bar"
                onClick={handleProgressClick}
              >
                <div 
                  className="podcast-progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        <button 
          className={`podcast-play-button ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlayPause}
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
      
      {isActive && <div className="podcast-divider"></div>}
    </div>
  )
}

export default PodcastPlayer