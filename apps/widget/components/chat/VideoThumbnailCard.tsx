'use client'

import { memo, useCallback } from 'react'
import type { Video } from '@/types'
import './VideoThumbnailCard.css'

interface VideoThumbnailCardProps {
  video: Video
  onClick: (videoId: string) => void
  className?: string
}

const VideoThumbnailCard = memo(function VideoThumbnailCard({ video, onClick, className = '' }: VideoThumbnailCardProps) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onClick(video.id)
  }, [onClick, video.id])

  return (
    <button
      className={`video-thumbnail-card ${className}`}
      onClick={handleClick}
      type="button"
      title={`Play video: ${video.title}`}
    >
      <div className="video-thumbnail-card__container">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="video-thumbnail-card__image"
        />
        <div className="video-thumbnail-card__play-icon">
          ▶
        </div>
      </div>
    </button>
  )
})

export default VideoThumbnailCard