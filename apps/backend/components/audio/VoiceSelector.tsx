'use client';

import { ELEVENLABS_VOICES, PODCAST_VOICES, INTERACTIVE_PODCAST_VOICE_ID } from '@repo/config/voices';

export interface PodcastVoiceSelection {
  interviewerVoiceId: string;
  guestVoiceId: string;
}

export interface SingleVoiceSelection {
  voiceId: string;
}

interface VoiceSelectorProps {
  mode: 'podcast' | 'single';
  value: PodcastVoiceSelection | SingleVoiceSelection;
  onChange: (value: PodcastVoiceSelection | SingleVoiceSelection) => void;
  disabled?: boolean;
}

interface VoiceCardProps {
  voice: typeof ELEVENLABS_VOICES[number];
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function VoiceCard({ voice, isSelected, onSelect, disabled }: VoiceCardProps) {
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
          voice.gender === 'male' ? 'bg-blue-500' : 'bg-purple-500'
        }`}>
          {voice.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="text-text-primary font-medium">{voice.name}</div>
          {voice.description && (
            <div className="text-xs text-text-muted">{voice.description}</div>
          )}
        </div>
      </div>
    </label>
  );
}

export function VoiceSelector({ mode, value, onChange, disabled = false }: VoiceSelectorProps) {
  const availableVoices = ELEVENLABS_VOICES.filter(v => v.id !== 'default');

  if (mode === 'podcast') {
    const podcastValue = value as PodcastVoiceSelection;

    return (
      <div className="space-y-6">
        {/* Interviewer Voice */}
        <div>
          <label className="block text-text-secondary text-sm font-medium mb-3">
            Interviewer Voice
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableVoices.map((voice) => (
              <VoiceCard
                key={`interviewer-${voice.id}`}
                voice={voice}
                isSelected={podcastValue.interviewerVoiceId === voice.voiceId}
                onSelect={() => onChange({ ...podcastValue, interviewerVoiceId: voice.voiceId })}
                disabled={disabled}
              />
            ))}
          </div>
        </div>

        {/* Guest Voice */}
        <div>
          <label className="block text-text-secondary text-sm font-medium mb-3">
            Guest Voice
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableVoices.map((voice) => (
              <VoiceCard
                key={`guest-${voice.id}`}
                voice={voice}
                isSelected={podcastValue.guestVoiceId === voice.voiceId}
                onSelect={() => onChange({ ...podcastValue, guestVoiceId: voice.voiceId })}
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
        Narrator Voice
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {availableVoices.map((voice) => (
          <VoiceCard
            key={voice.id}
            voice={voice}
            isSelected={singleValue.voiceId === voice.voiceId}
            onSelect={() => onChange({ voiceId: voice.voiceId })}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

// Helper to get default podcast voice selection
export function getDefaultPodcastVoices(): PodcastVoiceSelection {
  return {
    interviewerVoiceId: PODCAST_VOICES.interviewer.voiceId,
    guestVoiceId: PODCAST_VOICES.guest.voiceId,
  };
}

// Helper to get default interactive podcast voice selection
export function getDefaultInteractivePodcastVoice(): SingleVoiceSelection {
  return {
    voiceId: INTERACTIVE_PODCAST_VOICE_ID,
  };
}
