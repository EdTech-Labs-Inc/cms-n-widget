'use client';

import { useState, useRef, useEffect } from 'react';
import { useBackgroundMusic } from '@/lib/api/hooks';
import { Loader2, Play, Pause, Volume2, VolumeX, Check, Music } from 'lucide-react';
import type { BackgroundMusic } from '@repo/api-client';

interface MusicStepProps {
  orgSlug: string;
  selectedMusicId: string | null;
  musicVolume: number;
  onMusicSelect: (musicId: string | null) => void;
  onVolumeChange: (volume: number) => void;
  disabled?: boolean;
}

function MusicCard({
  music,
  selected,
  onClick,
  disabled,
}: {
  music: BackgroundMusic;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border-2 ${
        selected
          ? 'border-gold bg-gold/10'
          : 'border-white-20 bg-white-5 hover:border-white-40 hover:bg-white-10'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={handlePlayPause}
        disabled={disabled}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          isPlaying
            ? 'bg-gold text-navy-dark'
            : 'bg-white-20 text-text-primary hover:bg-white-30'
        }`}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>

      {/* Info */}
      <div className="flex-1 text-left min-w-0">
        <div className="font-medium text-text-primary truncate">{music.name}</div>
        {music.duration && (
          <div className="text-xs text-text-muted">
            {formatDuration(music.duration)}
          </div>
        )}
      </div>

      {/* Selected indicator */}
      {selected && (
        <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-navy-dark" />
        </div>
      )}

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={music.previewAudioUrl}
        onEnded={handleAudioEnded}
        preload="none"
      />
    </button>
  );
}

export function MusicStep({
  orgSlug,
  selectedMusicId,
  musicVolume,
  onMusicSelect,
  onVolumeChange,
  disabled = false,
}: MusicStepProps) {
  const {
    data: backgroundMusic,
    isLoading,
    isError,
  } = useBackgroundMusic(orgSlug);

  const musicList = backgroundMusic || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white-10 rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
        <span className="ml-2 text-text-muted">Loading music...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
        Failed to load background music. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Add background music to your video (optional):
      </p>

      {/* No Music Option */}
      <button
        type="button"
        onClick={() => onMusicSelect(null)}
        disabled={disabled}
        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border-2 ${
          selectedMusicId === null
            ? 'border-gold bg-gold/10'
            : 'border-white-20 bg-white-5 hover:border-white-40 hover:bg-white-10'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="w-10 h-10 rounded-full bg-white-20 flex items-center justify-center shrink-0">
          <VolumeX className="w-5 h-5 text-text-muted" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-medium text-text-primary">No Background Music</div>
          <div className="text-xs text-text-muted">Video will only have speech audio</div>
        </div>
        {selectedMusicId === null && (
          <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-navy-dark" />
          </div>
        )}
      </button>

      {/* Music Options */}
      {musicList.length === 0 ? (
        <div className="p-4 bg-white-10 rounded-xl text-text-muted text-sm flex items-center gap-2">
          <Music className="w-4 h-4" />
          <span>No background music tracks available yet.</span>
        </div>
      ) : (
        <div className="space-y-2">
          {musicList.map((music) => (
            <MusicCard
              key={music.id}
              music={music}
              selected={selectedMusicId === music.id}
              onClick={() => onMusicSelect(music.id)}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      {/* Volume Slider (only shown when music is selected) */}
      {selectedMusicId && (
        <div className="pt-4 border-t border-white-10">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Music Volume
            </label>
            <span className="text-sm font-medium text-text-primary">
              {Math.round(musicVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.01"
            value={musicVolume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            disabled={disabled}
            className="w-full h-2 bg-white-20 rounded-lg appearance-none cursor-pointer accent-gold disabled:opacity-50"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>0%</span>
            <span>15% (default)</span>
            <span>50%</span>
          </div>
          <p className="text-xs text-text-muted mt-2">
            Lower volume ensures the speech remains clearly audible.
          </p>
        </div>
      )}
    </div>
  );
}
