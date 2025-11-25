'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, AlertCircle, Clock, FileText, ChevronDown, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import type { PodcastOutput } from '@/lib/api/types';

interface PodcastPlayerProps {
  output: PodcastOutput;
}

export function PodcastPlayer({ output }: PodcastPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const updateBuffered = () => {
      if (audio.buffered.length > 0) {
        setBuffered(audio.buffered.end(audio.buffered.length - 1));
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('progress', updateBuffered);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('progress', updateBuffered);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - bounds.left) / bounds.width;
    audioRef.current.currentTime = percent * duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (output.status === 'PENDING' || output.status === 'PROCESSING') {
    return (
      <div className="flex items-center justify-center py-8 gap-3">
        <Loader2 className="w-5 h-5 text-blue-accent animate-spin" />
        <div className="text-text-secondary">
          {output.status === 'PENDING' ? 'Queued...' : 'Generating podcast...'}
        </div>
      </div>
    );
  }

  if (output.status === 'FAILED') {
    return (
      <div className="bg-red-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
        <div>
          <p className="text-red-400">Failed to generate podcast</p>
          {output.error && <p className="text-sm text-text-muted mt-2">{output.error}</p>}
        </div>
      </div>
    );
  }

  if (!output.audioFileUrl) {
    return (
      <div className="text-text-muted flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        No podcast available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={output.audioFileUrl} preload="metadata" />

      {/* Custom Player UI */}
      <div className="bg-white-10 rounded-3xl p-4">
        <div className="flex items-center gap-4">
          {/* Play/Pause button */}
          <button
            onClick={togglePlay}
            className="w-12 h-12 bg-purple-accent rounded-full flex items-center justify-center hover:shadow-glow-purple transition-all shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" fill="white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
            )}
          </button>

          {/* Progress and Time */}
          <div className="flex-1 space-y-2">
            {/* Progress Bar */}
            <div
              className="relative h-2 bg-white-10 rounded-full cursor-pointer group"
              onClick={handleSeek}
            >
              {/* Buffered progress (lighter) */}
              <div
                className="absolute inset-y-0 left-0 bg-white-20 rounded-full transition-all"
                style={{ width: `${(buffered / duration) * 100}%` }}
              />
              {/* Playback progress (purple gradient) */}
              <div
                className="absolute inset-y-0 left-0 bg-gradient-purple rounded-full transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              {/* Progress indicator */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-accent rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${(currentTime / duration) * 100}% - 8px)` }}
              />
            </div>

            {/* Time display */}
            <div className="flex justify-between text-xs text-text-muted">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript */}
      {output.segments && (
        <details className="group">
          <summary className="cursor-pointer text-text-secondary hover:text-text-primary flex items-center gap-2 p-3 bg-white-10 rounded-xl transition-all border-2 border-transparent hover:border-purple-accent/30">
            <FileText className="w-4 h-4" />
            View Transcript
            <ChevronDown className="w-4 h-4 ml-auto group-open:rotate-180 transition-transform" />
          </summary>
          <div className="mt-4 space-y-2 pl-4 border-l-2 border-purple-accent/30">
            {JSON.parse(output.transcript || '[]').map((segment: any, idx: number) => (
              <div key={idx} className="text-sm">
                <span className="text-purple-accent font-medium">{segment.speaker}:</span>{' '}
                <span className="text-text-secondary">{segment.text}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
