import { openaiService } from '../external/openai.service';
import { storageService } from '../core/storage.service';
import { logger } from '@repo/logging';

/**
 * Thumbnail Service - Generate AI thumbnails for content
 *
 * Uses OpenAI's GPT-Image-1 (with DALL-E 3 fallback) to generate professional thumbnail images
 * for articles, podcasts, videos, and interactive podcasts based on their titles.
 *
 * Workflow:
 * 1. Generate image with GPT-Image-1 (OpenAI), falling back to DALL-E 3 if needed
 * 2. Download the temporary image URL
 * 3. Upload to S3 storage
 * 4. Return permanent S3 URL
 */
export class ThumbnailService {
  /**
   * Generate a thumbnail for content based on its title
   *
   * @param title - The title of the content
   * @param resourceType - Type of content (article, podcast, video, interactive-podcast)
   * @param resourceId - ID of the resource (for S3 path organization)
   * @returns S3 URL of the uploaded thumbnail
   *
   * @example
   * const thumbnailUrl = await thumbnailService.generateThumbnail(
   *   'Understanding Stock Markets',
   *   'article',
   *   'article-uuid-123'
   * );
   */
  async generateThumbnail(
    title: string,
    resourceType: 'article' | 'podcast' | 'video' | 'interactive-podcast',
    resourceId: string,
    organizationId?: string
  ): Promise<string> {
    try {
      logger.info('Generating thumbnail', { resourceType, title });

      // Step 1: Generate image with GPT-Image-1 (falls back to DALL-E 3 automatically)
      const tempImageUrl = await openaiService.generateImage({
        title,
        customPrompt: 'for an Indian finance app',
        size: '1024x1024', // Square format works for all use cases
        quality: 'medium', // gpt-image-1 quality (auto-converts to 'standard' for dall-e-3 fallback)
      });

      // Step 2: Upload to S3 storage
      const thumbnailUrl = await storageService.uploadThumbnailFromUrl(
        tempImageUrl,
        resourceType,
        resourceId,
        'thumbnail.png',
        organizationId
      );

      logger.info('Thumbnail generated and uploaded', { thumbnailUrl });
      return thumbnailUrl;
    } catch (error) {
      logger.error('Failed to generate thumbnail', {
        resourceType,
        title,
        error: error instanceof Error ? error.message : error
      });

      // Don't throw - thumbnail generation is not critical
      // Return null or empty string to allow content creation to continue
      logger.warn('Continuing without thumbnail', { resourceType });
      throw error; // Re-throw for now, can be changed to return null if we want to make it non-blocking
    }
  }

  /**
   * Generate thumbnail with retry logic
   * Useful for backfilling where we want to be more resilient
   *
   * @param title - The title of the content
   * @param resourceType - Type of content (article, podcast, video, interactive-podcast)
   * @param resourceId - ID of the resource
   * @param maxRetries - Maximum number of retry attempts
   * @returns S3 URL of the uploaded thumbnail, or null if all retries fail
   */
  async generateThumbnailWithRetry(
    title: string,
    resourceType: 'article' | 'podcast' | 'video' | 'interactive-podcast',
    resourceId: string,
    maxRetries: number = 2,
    organizationId?: string
  ): Promise<string | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateThumbnail(title, resourceType, resourceId, organizationId);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        logger.warn('Thumbnail generation attempt failed', {
          attempt,
          maxRetries,
          error: lastError.message
        });

        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          logger.info('Waiting before retry', { delay });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    logger.error('All thumbnail generation attempts failed', {
      maxRetries,
      resourceType,
      title,
      error: lastError?.message
    });
    return null;
  }

  /**
   * Regenerate thumbnail with custom prompt and context from old thumbnail
   * Used when users want to update the thumbnail with specific guidance
   *
   * @param title - The title of the content
   * @param resourceType - Type of content (article, podcast, video, interactive-podcast)
   * @param resourceId - ID of the resource
   * @param customPrompt - User's custom prompt for regeneration guidance
   * @param oldThumbnailUrl - URL of the existing thumbnail (for context)
   * @returns S3 URL of the newly uploaded thumbnail
   *
   * @example
   * const newThumbnailUrl = await thumbnailService.regenerateThumbnailWithPrompt(
   *   'Understanding Stock Markets',
   *   'article',
   *   'article-uuid-123',
   *   'Make it more vibrant with charts and graphs',
   *   'https://cloudfront.com/old-thumbnail.png'
   * );
   */
  async regenerateThumbnailWithPrompt(
    title: string,
    resourceType: 'article' | 'podcast' | 'video' | 'interactive-podcast',
    resourceId: string,
    customPrompt: string,
    oldThumbnailUrl?: string,
    organizationId?: string
  ): Promise<string> {
    try {
      logger.info('Regenerating thumbnail', {
        resourceType,
        title,
        customPrompt,
        hasOldThumbnail: !!oldThumbnailUrl
      });

      // Build enhanced prompt that includes user's guidance and context
      let enhancedPrompt = customPrompt;
      if (!customPrompt.toLowerCase().includes('indian') && !customPrompt.toLowerCase().includes('finance')) {
        enhancedPrompt = `${customPrompt} for an Indian finance app`;
      }

      // Generate image with GPT-Image-1 (falls back to DALL-E 3 automatically)
      const tempImageUrl = await openaiService.generateImage({
        title,
        customPrompt: enhancedPrompt,
        size: '1024x1024',
        quality: 'medium',
      });

      // Upload to S3 storage with timestamp to avoid caching issues
      const timestamp = Date.now();
      const filename = `thumbnail-${timestamp}.png`;

      const thumbnailUrl = await storageService.uploadThumbnailFromUrl(
        tempImageUrl,
        resourceType,
        resourceId,
        filename,
        organizationId
      );

      logger.info('Thumbnail regenerated and uploaded', { thumbnailUrl });
      return thumbnailUrl;
    } catch (error) {
      logger.error('Failed to regenerate thumbnail', {
        resourceType,
        title,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }
}

// Singleton instance
export const thumbnailService = new ThumbnailService();
