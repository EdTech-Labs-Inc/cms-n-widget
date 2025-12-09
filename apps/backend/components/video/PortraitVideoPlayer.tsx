'use client';

import { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Download } from 'lucide-react';

interface PortraitVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string | null;
  title?: string | null;
  downloadUrl?: string;
}

export function PortraitVideoPlayer({ videoUrl, thumbnailUrl, title, downloadUrl }: PortraitVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  const handleDownload = () => {
    if (downloadUrl) {
      // Use the backend proxy route to download
      window.location.href = downloadUrl;
    }
  };

  return (
    <div
      className="relative aspect-[9/16] bg-navy-dark rounded-xl overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl || undefined}
        className="w-full h-full object-cover"
        onEnded={handleVideoEnd}
        onClick={togglePlay}
        playsInline
      />

      {/* Play overlay when not playing */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-16 h-16 rounded-full bg-gold/90 flex items-center justify-center hover:bg-gold transition-colors">
            <Play className="w-8 h-8 text-navy-dark ml-1" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent transition-opacity ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {title && (
          <p className="text-sm text-white font-medium mb-2 truncate">{title}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
              )}
            </button>
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {downloadUrl && (
              <button
                onClick={handleDownload}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                title="Download video"
              >
                <Download className="w-4 h-4 text-white" />
              </button>
            )}
            <button
              onClick={handleFullscreen}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
