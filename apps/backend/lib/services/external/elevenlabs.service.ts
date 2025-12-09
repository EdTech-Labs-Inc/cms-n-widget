import axios from 'axios';
import { logger } from '@repo/logging';
import { config } from '../../config/constants';

/**
 * ElevenLabs Service - Reusable wrapper for ElevenLabs Text-to-Speech API
 *
 * Features:
 * - Convert text to speech audio
 * - Support for different voices
 * - Returns audio buffer for storage
 */
export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private defaultVoiceId: string;
  private defaultModel: string;

  constructor() {
    this.apiKey = config.elevenlabs.apiKey;
    this.defaultVoiceId = config.elevenlabs.defaultVoiceId;
    this.defaultModel = config.elevenlabs.defaultModel;
  }

  /**
   * Convert text to speech
   *
   * @example
   * const audioBuffer = await elevenlabs.textToSpeech({
   *   text: "Hello, this is a test.",
   *   voiceId: "optional-voice-id"
   * });
   */
  async textToSpeech(params: {
    text: string;
    voiceId?: string;
    model?: string;
    stability?: number;
    similarityBoost?: number;
  }): Promise<Buffer> {
    try {
      const voiceId = params.voiceId || this.defaultVoiceId;
      const model = params.model || this.defaultModel;

      // Log the API key being used (masked for security)
      const maskedApiKey = this.apiKey
        ? `${this.apiKey.slice(0, 8)}...${this.apiKey.slice(-4)}`
        : 'NOT SET';
      logger.info('ElevenLabs textToSpeech - attempting API call', {
        voiceId,
        model,
        apiKeyUsed: maskedApiKey,
        apiKeyLength: this.apiKey?.length || 0,
        textLength: params.text.length,
      });

      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          text: params.text,
          model_id: model,
          voice_settings: {
            stability: params.stability ?? 0.5,
            similarity_boost: params.similarityBoost ?? 0.75,
          },
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          responseType: 'arraybuffer',
        }
      );

      return Buffer.from(response.data);
    } catch (error) {
      logger.error('ElevenLabs text-to-speech failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        voiceId: params.voiceId || this.defaultVoiceId,
        textLength: params.text.length,
      });
      if (axios.isAxiosError(error)) {
        const message = error.response?.data
          ? Buffer.from(error.response.data).toString()
          : error.message;
        throw new Error(`ElevenLabs API error: ${message}`);
      }
      throw new Error(`Failed to generate speech: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available voices from ElevenLabs
   *
   * @example
   * const voices = await elevenlabs.getVoices();
   */
  async getVoices(): Promise<
    Array<{
      voice_id: string;
      name: string;
      category: string;
      description?: string;
    }>
  > {
    try {
      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      return response.data.voices || [];
    } catch (error) {
      logger.error('Failed to fetch ElevenLabs voices', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error(`Failed to get voices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific voice by ID
   *
   * @example
   * const voice = await elevenlabs.getVoice("voice-id-here");
   */
  async getVoice(voiceId: string): Promise<{
    voice_id: string;
    name: string;
    category: string;
    description?: string;
  } | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/voices/${voiceId}`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch ElevenLabs voice', {
        voiceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Get voice IDs for different speakers (for podcasts)
   */
  getInterviewerVoiceId(): string {
    return config.elevenlabs.interviewerVoiceId;
  }

  getGuestVoiceId(): string {
    return config.elevenlabs.guestVoiceId;
  }
}

// Singleton instance
export const elevenlabsService = new ElevenLabsService();
