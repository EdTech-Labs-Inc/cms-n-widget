import axios from 'axios';
import { config } from '../../config/constants';
import { logger } from '@repo/logging';

/**
 * HeyGen Service - Reusable wrapper for HeyGen Video Generation API
 *
 * Features:
 * - Generate avatar videos from scripts
 * - Check video generation status
 * - Wait for video completion with polling
 */

export type CharacterType = 'avatar' | 'talking_photo';

// HeyGen API Response Types for List Avatars endpoint
export interface HeyGenApiAvatar {
  avatar_id: string;
  avatar_name: string;
  preview_image_url: string;
  preview_video_url?: string;
  gender?: string;
}

export interface HeyGenApiTalkingPhoto {
  talking_photo_id: string;
  talking_photo_name: string;
  preview_image_url: string;
}

export interface HeyGenAvatarListResponse {
  error: null | string;
  data: {
    avatars: HeyGenApiAvatar[];
    talking_photos: HeyGenApiTalkingPhoto[];
  };
}

// Avatar details response (for fetching voice info)
export interface HeyGenAvatarDetailsResponse {
  error: null | string;
  data: {
    type: string;
    id: string;
    name: string;
    preview_image_url: string;
    preview_video_url?: string;
    gender?: string;
    premium?: boolean;
    is_public?: boolean;
    default_voice_id?: string; // Flat string field, not nested object
    tags?: string[];
  };
}

// Processed avatar for frontend consumption
export interface ProcessedAvatar {
  id: string;
  name: string;
  type: CharacterType;
  previewUrl: string;
  voiceId: string;
}

export class HeyGenService {
  private apiKey: string;
  private baseUrl: string;
  private defaultTalkingPhotoId: string;
  private defaultAvatarId: string;
  private defaultVoiceId: string;
  private defaultCharacterType: CharacterType;

  constructor() {
    this.apiKey = config.heygen.apiKey;
    this.baseUrl = config.heygen.apiUrl;
    this.defaultTalkingPhotoId = config.heygen.defaultTalkingPhotoId;
    this.defaultAvatarId = config.heygen.defaultAvatarId;
    this.defaultVoiceId = config.heygen.defaultVoiceId;
    this.defaultCharacterType = config.heygen.defaultCharacterType;
  }

  /**
   * Get the default talking photo ID (if configured)
   */
  getDefaultTalkingPhotoId(): string | undefined {
    return this.defaultTalkingPhotoId || undefined;
  }

  /**
   * Get the default character configuration
   * Falls back to avatar if talking_photo is configured but ID is empty
   */
  getDefaultCharacterConfig(): { type: CharacterType; id: string } {
    // If configured for talking_photo but no ID, fall back to avatar
    if (this.defaultCharacterType === 'talking_photo' && !this.defaultTalkingPhotoId) {
      if (this.defaultAvatarId) {
        return { type: 'avatar', id: this.defaultAvatarId };
      }
    }

    // If configured for avatar but no ID, try talking_photo
    if (this.defaultCharacterType === 'avatar' && !this.defaultAvatarId) {
      if (this.defaultTalkingPhotoId) {
        return { type: 'talking_photo', id: this.defaultTalkingPhotoId };
      }
    }

    return {
      type: this.defaultCharacterType,
      id: this.defaultCharacterType === 'talking_photo'
        ? this.defaultTalkingPhotoId
        : this.defaultAvatarId
    };
  }

  /**
   * Generate a video from a script
   *
   * @example
   * // With explicit character type (recommended):
   * const { videoId } = await heygen.generateVideo({
   *   script: "Hello, welcome to our platform!",
   *   characterType: "talking_photo",
   *   characterId: "your-photo-id"
   * });
   *
   * // With explicit character type (avatar):
   * const { videoId } = await heygen.generateVideo({
   *   script: "Hello, welcome to our platform!",
   *   characterType: "avatar",
   *   characterId: "your-avatar-id"
   * });
   *
   * // Legacy support (backward compatible):
   * const { videoId } = await heygen.generateVideo({
   *   script: "Hello, welcome to our platform!",
   *   talkingPhotoId: "your-photo-id"  // Still works
   * });
   */
  async generateVideo(params: {
    script: string;
    // New explicit approach (recommended)
    characterType?: CharacterType;
    characterId?: string;
    // Legacy parameters (backward compatible)
    avatarId?: string;
    talkingPhotoId?: string;
    voiceId?: string;
    title?: string;
  }): Promise<{ videoId: string }> {
    try {
      // Log input parameters for debugging
      logger.info('HeyGen generateVideo called', {
        characterType: params.characterType ?? 'not provided',
        characterId: params.characterId ?? 'not provided',
        avatarId: params.avatarId ?? 'not provided',
        talkingPhotoId: params.talkingPhotoId ?? 'not provided',
        voiceId: params.voiceId ?? 'not provided',
        scriptLength: params.script.length,
      });

      const voiceId = params.voiceId || this.defaultVoiceId;

      // HeyGen API limits: max 1500 characters per video
      const maxLength = 1500;
      let script = params.script;

      if (script.length > maxLength) {
        logger.warn('Script exceeded maximum length, truncating', {
          actualLength: script.length,
          maxLength,
        });
        script = script.substring(0, maxLength);
      }

      // Determine character configuration
      let character: { type: string; talking_photo_id?: string; avatar_id?: string; avatar_style?: string };
      let configPath: string;

      if (params.characterType && params.characterId) {
        // New explicit approach
        configPath = 'EXPLICIT';
        character = params.characterType === 'talking_photo'
          ? { type: 'talking_photo', talking_photo_id: params.characterId }
          : { type: 'avatar', avatar_id: params.characterId, avatar_style: 'normal' };
      } else if (params.talkingPhotoId || params.avatarId) {
        // Legacy support: prefer talking photo over avatar
        configPath = 'LEGACY';
        character = params.talkingPhotoId
          ? { type: 'talking_photo', talking_photo_id: params.talkingPhotoId }
          : { type: 'avatar', avatar_id: params.avatarId!, avatar_style: 'normal' };
      } else {
        // Use defaults
        configPath = 'DEFAULTS';
        const defaultConfig = this.getDefaultCharacterConfig();
        logger.info('HeyGen using default config', {
          defaultCharacterType: this.defaultCharacterType,
          defaultTalkingPhotoId: this.defaultTalkingPhotoId || '(empty)',
          defaultAvatarId: this.defaultAvatarId || '(empty)',
          resolvedConfig: defaultConfig,
        });
        character = defaultConfig.type === 'talking_photo'
          ? { type: 'talking_photo', talking_photo_id: defaultConfig.id }
          : { type: 'avatar', avatar_id: defaultConfig.id, avatar_style: 'normal' };
      }

      // Log the resolved character configuration
      logger.info('HeyGen character config resolved', {
        configPath,
        character,
        voiceId,
      });

      const response = await axios.post(
        `${this.baseUrl}/video/generate`,
        {
          video_inputs: [
            {
              character,
              voice: {
                type: 'text',
                input_text: script,
                voice_id: voiceId, // Required by HeyGen API
              },
            },
          ],
          dimension: {
            width: 720, // Portrait orientation (9:16)
            height: 1280,
          },
          test: false, // Set to false for production videos
          title: params.title || 'Video',
        },
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      const videoId = response.data?.data?.video_id;

      if (!videoId) {
        throw new Error('HeyGen did not return a video ID');
      }

      logger.info('HeyGen video creation initiated', {
        videoId,
        characterType: character.type,
        scriptLength: script.length,
      });

      return { videoId };
    } catch (error) {
      logger.error('HeyGen video generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        scriptLength: params.script.length,
      });
      if (axios.isAxiosError(error)) {
        // Log full error response for debugging
        logger.error('HeyGen API error details', {
          statusCode: error.response?.status,
          data: error.response?.data,
        });
        const errorData = error.response?.data?.error;
        const message = errorData?.message || error.response?.data?.message || error.message;
        throw new Error(`HeyGen API error: ${message}`);
      }
      throw new Error(`Failed to generate video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all available avatars and talking photos from HeyGen
   *
   * @returns Combined list of avatars and talking photos
   */
  async listAvatars(): Promise<HeyGenAvatarListResponse> {
    try {
      console.log('🎭 [HeyGenService] listAvatars() called');
      console.log('🎭 [HeyGenService] API URL:', `${this.baseUrl}/avatars`);
      console.log('🎭 [HeyGenService] API Key present:', !!this.apiKey);
      logger.info('Fetching avatars from HeyGen API');

      const response = await axios.get<HeyGenAvatarListResponse>(
        `${this.baseUrl}/avatars`,
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      const avatarCount = response.data?.data?.avatars?.length ?? 0;
      const talkingPhotoCount = response.data?.data?.talking_photos?.length ?? 0;

      console.log('🎭 [HeyGenService] Response received:', {
        avatarCount,
        talkingPhotoCount,
        total: avatarCount + talkingPhotoCount,
      });
      logger.info('HeyGen avatars fetched successfully', {
        avatarCount,
        talkingPhotoCount,
        total: avatarCount + talkingPhotoCount,
      });

      return response.data;
    } catch (error) {
      console.error('🎭 [HeyGenService] ERROR:', error);
      logger.error('Failed to fetch HeyGen avatars', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (axios.isAxiosError(error)) {
        console.error('🎭 [HeyGenService] Axios error:', {
          status: error.response?.status,
          data: error.response?.data,
        });
        logger.error('HeyGen API error details', {
          statusCode: error.response?.status,
          data: error.response?.data,
        });
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`HeyGen API error: ${message}`);
      }

      throw new Error(`Failed to fetch avatars: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get detailed information about a specific avatar
   *
   * @param avatarId - The avatar ID to fetch details for
   * @returns Avatar details including default voice information
   */
  async getAvatarDetails(avatarId: string): Promise<HeyGenAvatarDetailsResponse> {
    try {
      logger.info('Fetching avatar details from HeyGen API', { avatarId });

      const response = await axios.get<HeyGenAvatarDetailsResponse>(
        `${this.baseUrl}/avatar/${avatarId}/details`,
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      // Log full response to understand the data structure
      console.log('🎭 [HeyGenService] Avatar details response:', JSON.stringify(response.data, null, 2));

      logger.info('HeyGen avatar details fetched successfully', {
        avatarId,
        hasDefaultVoice: !!response.data?.data?.default_voice_id,
        defaultVoiceId: response.data?.data?.default_voice_id,
        fullData: response.data?.data,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch HeyGen avatar details', {
        avatarId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (axios.isAxiosError(error)) {
        logger.error('HeyGen API error details', {
          statusCode: error.response?.status,
          data: error.response?.data,
        });
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`HeyGen API error: ${message}`);
      }

      throw new Error(`Failed to fetch avatar details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
export const heygenService = new HeyGenService();
