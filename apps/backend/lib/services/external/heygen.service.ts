import axios from 'axios';
import { config } from '../../config/constants';
import { logger } from '@repo/logging';

/**
 * HeyGen Service - Reusable wrapper for HeyGen Avatar IV Video Generation API
 *
 * Features:
 * - Generate Avatar IV videos using image_key from uploaded photos
 * - Supports both text-to-speech and pre-generated audio modes
 * - Advanced AI-powered motion and expressions
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
   * Generate an Avatar IV video using the new HeyGen IV API
   *
   * @example
   * // With audio URL (ElevenLabs workflow - primary use case):
   * const { videoId } = await heygen.generateVideo({
   *   imageKey: "uploaded-image-key",
   *   audioUrl: "https://cdn.example.com/audio.mp3",
   *   voiceId: "voice-id",
   *   title: "My Video"
   * });
   *
   * // With script (HeyGen TTS):
   * const { videoId } = await heygen.generateVideo({
   *   imageKey: "uploaded-image-key",
   *   script: "Hello, welcome to our platform!",
   *   voiceId: "voice-id",
   *   title: "My Video"
   * });
   */
  async generateVideo(params: {
    // Image key from HeyGen Upload Asset API (required for IV API)
    imageKey: string;
    // Script for text-to-speech mode
    script?: string;
    // Audio URL for pre-generated audio (uses ElevenLabs)
    audioUrl?: string;
    // Voice ID (required)
    voiceId: string;
    // Video title
    title?: string;
  }): Promise<{ videoId: string }> {
    try {
      // Validate: imageKey is required
      if (!params.imageKey) {
        throw new Error('imageKey is required for Avatar IV video generation');
      }

      // Validate: either audioUrl or script must be provided
      if (!params.audioUrl && !params.script) {
        throw new Error('Either audioUrl or script must be provided');
      }

      // Validate: voiceId is required
      if (!params.voiceId) {
        throw new Error('voiceId is required for Avatar IV video generation');
      }

      // Log input parameters for debugging
      logger.info('HeyGen Avatar IV generateVideo called', {
        imageKey: params.imageKey,
        voiceId: params.voiceId,
        audioUrl: params.audioUrl ? 'provided' : 'not provided',
        scriptLength: params.script?.length ?? 0,
        useExternalAudio: !!params.audioUrl,
        title: params.title,
      });

      // Build request body for Avatar IV API
      const requestBody: Record<string, unknown> = {
        image_key: params.imageKey,
        video_title: params.title || 'Video',
        voice_id: params.voiceId,
        video_orientation: 'portrait', // 9:16 aspect ratio
        fit: 'cover', // Scale to cover entire frame
      };

      // Add either audio_url or script based on mode
      if (params.audioUrl) {
        requestBody.audio_url = params.audioUrl;
      } else {
        requestBody.script = params.script;
      }

      logger.info('HeyGen Avatar IV request body', {
        image_key: params.imageKey,
        video_title: requestBody.video_title,
        voice_id: params.voiceId,
        video_orientation: 'portrait',
        fit: 'cover',
        has_audio_url: !!params.audioUrl,
        has_script: !!params.script,
      });

      const response = await axios.post(
        `${this.baseUrl}/video/av4/generate`,
        requestBody,
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

      logger.info('HeyGen Avatar IV video creation initiated', {
        videoId,
        imageKey: params.imageKey,
        useExternalAudio: !!params.audioUrl,
        scriptLength: params.script?.length ?? 0,
      });

      return { videoId };
    } catch (error) {
      logger.error('HeyGen Avatar IV video generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        imageKey: params.imageKey,
        scriptLength: params.script?.length ?? 0,
        useExternalAudio: !!params.audioUrl,
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

  /**
   * Upload an asset (image) to HeyGen to get an image_key for Avatar IV API
   *
   * @param fileBuffer - The image file as a Buffer
   * @param fileName - Original filename (e.g., "avatar.jpg")
   * @param contentType - MIME type (e.g., "image/jpeg" or "image/png")
   * @returns The image_key to use with Avatar IV video generation
   *
   * @example
   * const { imageKey } = await heygen.uploadAsset(buffer, "avatar.jpg", "image/jpeg");
   */
  async uploadAsset(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<{ imageKey: string }> {
    try {
      logger.info('Uploading asset to HeyGen', {
        fileName,
        contentType,
        fileSize: fileBuffer.length,
      });

      // HeyGen Upload Asset API expects raw file bytes in the body
      const response = await axios.post(
        'https://upload.heygen.com/v1/asset',
        fileBuffer,
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': contentType,
          },
        }
      );

      // HeyGen returns the asset ID in data.asset_id or data.image_key
      const imageKey = response.data?.data?.asset_id || response.data?.data?.image_key;

      if (!imageKey) {
        logger.error('HeyGen upload response missing imageKey', {
          responseData: response.data,
        });
        throw new Error('HeyGen did not return an asset ID/image_key');
      }

      logger.info('HeyGen asset uploaded successfully', {
        imageKey,
        fileName,
      });

      return { imageKey };
    } catch (error) {
      logger.error('HeyGen asset upload failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName,
        contentType,
      });

      if (axios.isAxiosError(error)) {
        logger.error('HeyGen upload API error details', {
          statusCode: error.response?.status,
          data: error.response?.data,
        });
        const message = error.response?.data?.error?.message || error.response?.data?.message || error.message;
        throw new Error(`HeyGen upload failed: ${message}`);
      }

      throw new Error(`Failed to upload asset to HeyGen: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
export const heygenService = new HeyGenService();
