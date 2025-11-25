import axios from 'axios';
import { config } from '../../config/constants';

/**
 * HeyGen Service - Reusable wrapper for HeyGen Video Generation API
 *
 * Features:
 * - Generate avatar videos from scripts
 * - Check video generation status
 * - Wait for video completion with polling
 */

export type CharacterType = 'avatar' | 'talking_photo';

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
   */
  getDefaultCharacterConfig(): { type: CharacterType; id: string } {
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
      const voiceId = params.voiceId || this.defaultVoiceId;

      // HeyGen API limits: max 1500 characters per video
      const maxLength = 1500;
      let script = params.script;

      if (script.length > maxLength) {
        console.warn(`⚠️  Script too long (${script.length} chars), truncating to ${maxLength} chars`);
        script = script.substring(0, maxLength);
      }

      // Determine character configuration
      let character: { type: string; talking_photo_id?: string; avatar_id?: string; avatar_style?: string };

      if (params.characterType && params.characterId) {
        // New explicit approach
        character = params.characterType === 'talking_photo'
          ? { type: 'talking_photo', talking_photo_id: params.characterId }
          : { type: 'avatar', avatar_id: params.characterId, avatar_style: 'normal' };
      } else if (params.talkingPhotoId || params.avatarId) {
        // Legacy support: prefer talking photo over avatar
        character = params.talkingPhotoId
          ? { type: 'talking_photo', talking_photo_id: params.talkingPhotoId }
          : { type: 'avatar', avatar_id: params.avatarId!, avatar_style: 'normal' };
      } else {
        // Use defaults
        const defaultConfig = this.getDefaultCharacterConfig();
        character = defaultConfig.type === 'talking_photo'
          ? { type: 'talking_photo', talking_photo_id: defaultConfig.id }
          : { type: 'avatar', avatar_id: defaultConfig.id, avatar_style: 'normal' };
      }

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

      console.log(`🎬 HeyGen video ${videoId} creation initiated. Webhook will be called when ready.`);

      return { videoId };
    } catch (error) {
      console.error('HeyGen Generate Video Error:', error);
      if (axios.isAxiosError(error)) {
        // Log full error response for debugging
        console.error('HeyGen API Response:', JSON.stringify(error.response?.data, null, 2));
        const errorData = error.response?.data?.error;
        const message = errorData?.message || error.response?.data?.message || error.message;
        throw new Error(`HeyGen API error: ${message}`);
      }
      throw new Error(`Failed to generate video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
export const heygenService = new HeyGenService();
