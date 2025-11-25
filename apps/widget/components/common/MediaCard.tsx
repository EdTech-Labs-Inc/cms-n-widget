'use client';

import { memo, useCallback } from 'react';
import './MediaCard.css';

export interface MediaCardProps {
  id: string;
  title: string;
  thumbnail: string;
  variant?: 'video' | 'article' | 'podcast';
  metadata?: {
    duration?: string; // "5min" or "5:30"
    viewCount?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    readTime?: string;
  };
  status?: {
    isCompleted?: boolean;
    progress?: number; // 0-100
  };
  onClick: (id: string) => void;
  className?: string;
  showPlayIcon?: boolean;
}

const MediaCard = memo(function MediaCard({ id, title, thumbnail, variant = 'video', metadata = {}, status = {}, onClick, className = '', showPlayIcon = true }: MediaCardProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onClick(id);
    },
    [onClick, id],
  );

  return (
    <button
      className={`media-card media-card--${variant} ${className}`}
      onClick={handleClick}
      type="button"
      title={`${variant === 'video' ? 'Play' : 'Open'} ${variant}: ${title}`}
    >
      <div className="media-card__thumbnail-container">
        <img src={thumbnail} alt={title} className="media-card__thumbnail" />

        {/* Play icon for videos */}
        {variant === 'video' && showPlayIcon && (
          <div className="media-card__play-icon">
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
              <path d="M5 3l14 9-14 9V3z" fill="currentColor" />
            </svg>
          </div>
        )}

        {/* Completion overlay */}
        {status.isCompleted && (
          <div className="media-card__completed-overlay">
            <svg className="media-card__check-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="var(--success-green, #22c55e)" />
              <path d="M16 8.5L10 14.5L7 11.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Duration badge */}
        {metadata.duration && <div className="media-card__duration">{metadata.duration}</div>}

        {/* Difficulty indicator */}
        {metadata.difficulty && (
          <div className={`media-card__difficulty media-card__difficulty--${metadata.difficulty}`}>
            {metadata.difficulty === 'beginner' && '●'}
            {metadata.difficulty === 'intermediate' && '●●'}
            {metadata.difficulty === 'advanced' && '●●●'}
          </div>
        )}

        {/* Progress bar */}
        {status.progress !== undefined && status.progress > 0 && !status.isCompleted && (
          <div className="media-card__progress">
            <div className="media-card__progress-bar" style={{ width: `${status.progress}%` }} />
          </div>
        )}
      </div>

      <div className="media-card__info">
        <h3 className="media-card__title">{title}</h3>

        {/* Metadata section */}
        <div className="media-card__meta">
          {metadata.viewCount && <span className="media-card__views">{metadata.viewCount.toLocaleString()} views</span>}

          {metadata.readTime && <span className="media-card__read-time">{metadata.readTime}</span>}

          {metadata.difficulty && <span className="media-card__difficulty">{metadata.difficulty}</span>}

          {/* {!status.isCompleted && !status.progress && (
            <div className="media-card__new-indicator" />
          )} */}
        </div>
      </div>
    </button>
  );
});

export default MediaCard;
