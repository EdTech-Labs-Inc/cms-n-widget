import axios from 'axios';
import { config } from '../../config/constants';
import { logger } from '@repo/logging';

/**
 * Submagic Service - AI Video Editing API
 *
 * Features:
 * - Upload videos for AI editing and captioning
 * - Add magic zooms and B-rolls
 * - Apply caption templates
 * - Receive webhook notifications when processing completes
 */
export class SubmagicService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = config.submagic.apiKey;
    this.baseUrl = config.submagic.apiUrl;
  }

  /**
   * Map our language enum to Submagic language codes
   * Submagic only supports English and Hindi, so Marathi and Bengali fallback to Hindi
   */
  private mapLanguageToSubmagic(language?: string): { code: string; note?: string } {
    switch (language) {
      case 'ENGLISH':
        return { code: 'en' };
      case 'HINDI':
        return { code: 'hi' };
      case 'MARATHI':
        return { code: 'hi', note: 'Using Hindi captions (Submagic limitation)' };
      case 'BENGALI':
        return { code: 'hi', note: 'Using Hindi captions (Submagic limitation)' };
      default:
        return { code: 'en', note: 'Defaulting to English captions' };
    }
  }

  /**
   * Upload a video to Submagic for AI editing
   *
   * @param videoUrl - URL of the video to edit (e.g., HeyGen video URL)
   * @param webhookUrl - Webhook URL to receive completion notification
   * @param title - Optional title for the project
   * @param language - Optional language (ENGLISH | HINDI | MARATHI | BENGALI)
   * @param options - Optional customization options for editing
   * @returns Project ID from Submagic
   *
   * @example
   * const { projectId } = await submagicService.uploadVideoForEditing(
   *   'https://heygen.com/video.mp4',
   *   'https://myapp.com/api/webhooks/submagic',
   *   'My Video',
   *   'HINDI',
   *   {
   *     templateName: 'Hormozi 1',
   *     enableCaptions: true,
   *     magicZooms: true,
   *     magicBrolls: true,
   *     magicBrollsPercentage: 50,
   *   }
   * );
   */
  async uploadVideoForEditing(
    videoUrl: string,
    webhookUrl: string,
    title: string = 'Video Editing Project',
    language?: string,
    options?: {
      templateName?: string;
      enableCaptions?: boolean;
      magicZooms?: boolean;
      magicBrolls?: boolean;
      magicBrollsPercentage?: number;
    }
  ): Promise<{ projectId: string }> {
    try {
      // Map language to Submagic language code
      const { code: languageCode, note } = this.mapLanguageToSubmagic(language);

      logger.info('Uploading video to Submagic for AI editing', {
        videoUrl,
        webhookUrl,
        language,
        languageCode,
        languageMappingNote: note,
      });

      // Apply default values or use provided options
      const templateName = options?.templateName ?? 'Ella';
      const enableCaptions = options?.enableCaptions ?? true;
      const magicZooms = options?.magicZooms ?? true;
      const magicBrolls = options?.magicBrolls ?? true;
      const magicBrollsPercentage = options?.magicBrollsPercentage ?? 40;

      logger.info('Submagic configuration applied', {
        templateName,
        enableCaptions,
        magicZooms,
        magicBrolls,
        magicBrollsPercentage,
      });

      const response = await axios.post(
        `${this.baseUrl}/projects`,
        {
          title,
          language: languageCode,
          videoUrl,
          templateName,
          webhookUrl,
          magicZooms,
          magicBrolls,
          magicBrollsPercentage,
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      const projectId = response.data?.id;

      if (!projectId) {
        throw new Error('Submagic did not return a project ID');
      }

      logger.info('Submagic project created, awaiting webhook notification', {
        projectId,
        webhookUrl,
      });

      return { projectId };
    } catch (error) {
      logger.error('Submagic video upload failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        videoUrl,
      });
      if (axios.isAxiosError(error)) {
        // Log full error response for debugging
        logger.error('Submagic API error details', {
          statusCode: error.response?.status,
          data: error.response?.data,
        });
        const errorData = error.response?.data?.error;
        const message = errorData?.message || error.response?.data?.message || error.message;
        throw new Error(`Submagic API error: ${message}`);
      }
      throw new Error(`Failed to upload video to Submagic: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get project status (for polling if webhook fails)
   *
   * @param projectId - The Submagic project ID
   * @returns Project status and video URL if completed
   */
  async getProjectStatus(projectId: string): Promise<{
    status: string;
    videoUrl?: string;
    error?: string;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/projects/${projectId}`,
        {
          headers: {
            'x-api-key': this.apiKey,
          },
        }
      );

      return {
        status: response.data?.status || 'unknown',
        videoUrl: response.data?.videoUrl,
        error: response.data?.error,
      };
    } catch (error) {
      logger.error('Failed to get Submagic project status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        projectId,
      });
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Submagic API error: ${message}`);
      }
      throw new Error(`Failed to get project status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
export const submagicService = new SubmagicService();
