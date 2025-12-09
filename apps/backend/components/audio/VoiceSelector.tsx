'use client';

import { useState, useRef, useEffect } from 'react';
import { useVoices } from '@/lib/api/hooks';
import type { Voice } from '@/lib/api/types';
import { Loader2, Play, Pause, Volume2 } from 'lucide-react';

export interface PodcastVoiceSelection {
  interviewerVoiceId: string;
  guestVoiceId: string;
}

export interface SingleVoiceSelection {
  voiceId: string;
}

interface VoiceSelectorProps {
  orgSlug: string;
  mode: 'podcast' | 'single';
  value: PodcastVoiceSelection | SingleVoiceSelection;
  onChange: (value: PodcastVoiceSelection | SingleVoiceSelection) => void;
  disabled?: boolean;
}

interface VoiceCardProps {
  voice: Voice;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function VoiceCard({ voice, isSelected, onSelect, disabled }: VoiceCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!voice.previewAudioUrl) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // Create new audio element if needed
    if (!audioRef.current) {
      audioRef.current = new Audio(voice.previewAudioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => setIsPlaying(false);
    }

    audioRef.current.play();
    setIsPlaying(true);
  };

  return (
    <label
      className={`flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
        isSelected
          ? 'bg-gold-light border-gold'
          : 'bg-white-10 border-transparent hover:bg-white-20'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input
        type="radio"
        checked={isSelected}
        onChange={onSelect}
        className="sr-only"
        disabled={disabled}
      />
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
          voice.gender === 'male' ? 'bg-blue-500' : voice.gender === 'female' ? 'bg-purple-500' : 'bg-gray-500'
        }`}>
          {voice.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-text-primary font-medium truncate">{voice.name}</div>
          {voice.description && (
            <div className="text-xs text-text-muted line-clamp-2">{voice.description}</div>
          )}
        </div>
        {voice.previewAudioUrl && (
          <button
            type="button"
            onClick={handlePreviewClick}
            className={`p-2 rounded-lg transition-colors shrink-0 ${
              isPlaying
                ? 'bg-gold text-navy-dark'
                : 'bg-white-20 text-text-secondary hover:bg-white-30 hover:text-text-primary'
            }`}
            title={isPlaying ? 'Stop preview' : 'Play preview'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </label>
  );
}

export function VoiceSelector({ orgSlug, mode, value, onChange, disabled = false }: VoiceSelectorProps) {
  const { data: voices, isLoading, isError } = useVoices(orgSlug);

  const availableVoices = voices || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white-10 rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
        <span className="ml-2 text-text-muted">Loading voices...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
        Failed to load voices. Please try again later.
      </div>
    );
  }

  if (availableVoices.length === 0) {
    return (
      <div className="p-4 bg-white-10 rounded-xl text-text-muted text-sm">
        No voices available. Please contact an administrator to add voices for your organization.
      </div>
    );
  }

  if (mode === 'podcast') {
    const podcastValue = value as PodcastVoiceSelection;

    return (
      <div className="space-y-6">
        {/* Interviewer Voice */}
        <div>
          <label className="block text-text-secondary text-sm font-medium mb-3">
            <Volume2 className="w-4 h-4 inline mr-2" />
            Interviewer Voice
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableVoices.map((voice) => (
              <VoiceCard
                key={`interviewer-${voice.id}`}
                voice={voice}
                isSelected={podcastValue.interviewerVoiceId === voice.elevenlabsVoiceId}
                onSelect={() => onChange({ ...podcastValue, interviewerVoiceId: voice.elevenlabsVoiceId })}
                disabled={disabled}
              />
            ))}
          </div>
        </div>

        {/* Guest Voice */}
        <div>
          <label className="block text-text-secondary text-sm font-medium mb-3">
            <Volume2 className="w-4 h-4 inline mr-2" />
            Guest Voice
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableVoices.map((voice) => (
              <VoiceCard
                key={`guest-${voice.id}`}
                voice={voice}
                isSelected={podcastValue.guestVoiceId === voice.elevenlabsVoiceId}
                onSelect={() => onChange({ ...podcastValue, guestVoiceId: voice.elevenlabsVoiceId })}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Single voice mode (for interactive podcast)
  const singleValue = value as SingleVoiceSelection;

  return (
    <div>
      <label className="block text-text-secondary text-sm font-medium mb-3">
        <Volume2 className="w-4 h-4 inline mr-2" />
        Narrator Voice
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {availableVoices.map((voice) => (
          <VoiceCard
            key={voice.id}
            voice={voice}
            isSelected={singleValue.voiceId === voice.elevenlabsVoiceId}
            onSelect={() => onChange({ voiceId: voice.elevenlabsVoiceId })}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

// Helper to get default podcast voice selection (first two voices from DB)
export function getDefaultPodcastVoicesFromList(voices: Voice[]): PodcastVoiceSelection {
  const defaultVoice = voices[0]?.elevenlabsVoiceId || '';
  const secondVoice = voices[1]?.elevenlabsVoiceId || defaultVoice;
  return {
    interviewerVoiceId: defaultVoice,
    guestVoiceId: secondVoice,
  };
}

// Helper to get default interactive podcast voice selection (first voice from DB)
export function getDefaultInteractivePodcastVoiceFromList(voices: Voice[]): SingleVoiceSelection {
  return {
    voiceId: voices[0]?.elevenlabsVoiceId || '',
  };
}
