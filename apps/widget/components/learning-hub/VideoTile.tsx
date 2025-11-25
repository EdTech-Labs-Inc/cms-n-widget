'use client'

import { motion } from 'framer-motion'
import { useContentCompletion } from '@/hooks/useContentCompletion'

interface VideoTileProps {
  video: {
    id: string
    title: string
    thumbnailUrl: string
  }
  variants: any
  index: number
  onClick: () => void
}

function VideoTile({ video, variants, index, onClick }: VideoTileProps) {
  const completionInfo = useContentCompletion(video.id)

  return (
    <motion.div
      key={video.id}
      className="video-tile"
      variants={variants}
      custom={index}
      onClick={onClick}
    >
      <div className="video-tile-thumbnail">
        <img src={video.thumbnailUrl} alt={video.title} className="video-tile-image" />

        {completionInfo?.completed ? (
          <div className="video-tile-completed-overlay">
            <div className="video-tile-check-icon-container">
              <svg className="video-tile-check-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="11" fill="url(#checkGradientTile)" opacity="0.2"/>
                <circle cx="12" cy="12" r="10" fill="url(#checkGradientTile)"/>
                <path d="M7 12L10.5 15.5L17 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="checkGradientTile" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#10b981"/>
                    <stop offset="100%" stopColor="#059669"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            {completionInfo.xpEarned > 0 && (
              <div className="video-tile-xp-badge">
                +{completionInfo.xpEarned} XP
              </div>
            )}
          </div>
        ) : (
          <div className="video-tile-overlay">
            <div className="video-tile-play-icon"></div>
          </div>
        )}
      </div>
      <div className="video-tile-info">
        <h3 className="video-tile-title">{video.title}</h3>
      </div>
    </motion.div>
  )
}

export default VideoTile
