/**
 * ElevenLabs Voice Configuration
 *
 * Defines voice IDs for different use cases (audio, podcast, interactive content)
 */

export interface VoiceConfig {
  id: string;
  voiceId: string;
  name: string;
  description?: string;
  language?: string;
  gender?: 'male' | 'female' | 'neutral';
}

/**
 * Default voice for audio generation
 */
export const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

/**
 * Podcast voices (interviewer and guest)
 */
export const PODCAST_VOICES = {
  interviewer: {
    id: 'interviewer',
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Herin',
    description: 'Professional male interviewer voice',
    gender: 'male' as const,
  },
  guest: {
    id: 'guest',
    voiceId: 'ErXwobaYiN019PkySvjV',
    name: 'Isha',
    description: 'Professional female guest voice',
    gender: 'female' as const,
  },
};

/**
 * Interactive podcast voice (single speaker)
 */
export const INTERACTIVE_PODCAST_VOICE_ID = 'ErXwobaYiN019PkySvjV';

/**
 * Available ElevenLabs voices
 */
export const ELEVENLABS_VOICES: VoiceConfig[] = [
  {
    id: 'default',
    voiceId: DEFAULT_VOICE_ID,
    name: 'Default Voice',
    description: 'Default voice for audio generation',
  },
  {
    id: 'interviewer',
    voiceId: PODCAST_VOICES.interviewer.voiceId,
    name: PODCAST_VOICES.interviewer.name,
    description: PODCAST_VOICES.interviewer.description,
    gender: 'male',
  },
  {
    id: 'guest',
    voiceId: PODCAST_VOICES.guest.voiceId,
    name: PODCAST_VOICES.guest.name,
    description: PODCAST_VOICES.guest.description,
    gender: 'female',
  },
];

/**
 * Get voice by ID
 */
export function getVoiceById(id: string): VoiceConfig | undefined {
  return ELEVENLABS_VOICES.find((voice) => voice.id === id);
}

/**
 * Get default voice
 */
export function getDefaultVoice(): VoiceConfig {
  return ELEVENLABS_VOICES[0];
}

/**
 * Get interviewer voice for podcasts
 */
export function getInterviewerVoice(): VoiceConfig {
  return PODCAST_VOICES.interviewer;
}

/**
 * Get guest voice for podcasts
 */
export function getGuestVoice(): VoiceConfig {
  return PODCAST_VOICES.guest;
}
