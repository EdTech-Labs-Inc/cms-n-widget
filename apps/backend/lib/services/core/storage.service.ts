import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, STORAGE_BUCKET } from '../../config/storage';
import { config } from '../../config/constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload result containing both CloudFront and S3 URLs
 */
export interface UploadResult {
  cloudfrontUrl: string;  // For user delivery and database storage
  s3Url: string;          // For AWS services (Transcribe, etc.)
  key: string;            // The S3 object key
}

/**
 * Storage Service - Handle file uploads to S3/Cloudflare R2
 *
 * Features:
 * - Upload files (audio, video, etc.)
 * - Generate public URLs
 * - Generate signed URLs with expiration
 * - Organized folder structure
 */
export class StorageService {
  private bucket: string;
  private region: string;

  constructor() {
    this.bucket = STORAGE_BUCKET;
    this.region = process.env.S3_REGION || 'ap-south-1';
  }

  /**
   * Upload a file to storage
   *
   * @example
   * const result = await storage.uploadFile(
   *   audioBuffer,
   *   'audio/speakable-script.mp3',
   *   'audio/mpeg'
   * );
   * // Use result.cloudfrontUrl for database/delivery
   * // Use result.s3Url for AWS services (Transcribe, etc.)
   */
  async uploadFile(
    buffer: Buffer,
    filePath: string,
    contentType: string = 'application/octet-stream'
  ): Promise<UploadResult> {
    try {
      // Add UUID to prevent filename collisions
      const fileName = this.addUuidToFilename(filePath);

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        Body: buffer,
        ContentType: contentType,
      });

      await s3Client.send(command);

      // Return both CloudFront and S3 URLs
      return {
        cloudfrontUrl: this.getCloudfrontUrl(fileName),
        s3Url: this.getS3Url(fileName),
        key: fileName,
      };
    } catch (error) {
      console.error('Storage Upload Error:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload an audio file
   */
  async uploadAudio(buffer: Buffer, submissionId: string, filename: string, organizationId?: string): Promise<UploadResult> {
    const filePath = organizationId
      ? `organizations/${organizationId}/audio/${submissionId}/${filename}`
      : `audio/${submissionId}/${filename}`; // Fallback for legacy/migration
    return this.uploadFile(buffer, filePath, 'audio/mpeg');
  }

  /**
   * Upload a video file (by URL - download then upload)
   */
  async uploadVideoFromUrl(videoUrl: string, submissionId: string, filename: string, organizationId?: string): Promise<UploadResult> {
    try {
      // Download video from HeyGen URL
      const response = await fetch(videoUrl);
      const buffer = Buffer.from(await response.arrayBuffer());

      const filePath = organizationId
        ? `organizations/${organizationId}/videos/${submissionId}/${filename}`
        : `videos/${submissionId}/${filename}`; // Fallback for legacy/migration
      return this.uploadFile(buffer, filePath, 'video/mp4');
    } catch (error) {
      console.error('Video Upload Error:', error);
      throw new Error(`Failed to upload video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload a thumbnail image from URL or data URL (e.g., from OpenAI DALL-E or GPT-Image-1)
   * Supports both regular HTTPS URLs and base64 data URLs
   */
  async uploadThumbnailFromUrl(imageUrl: string, resourceType: 'article' | 'podcast' | 'video' | 'interactive-podcast', resourceId: string, filename: string = 'thumbnail.png', organizationId?: string): Promise<string> {
    try {
      let buffer: Buffer;
      let contentType: string;

      // Check if this is a data URL (base64 encoded)
      if (imageUrl.startsWith('data:')) {
        console.log(`📥 Processing base64 data URL thumbnail...`);

        // Extract the content type and base64 data
        const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          throw new Error('Invalid data URL format');
        }

        contentType = matches[1] || 'image/png';
        const base64Data = matches[2];

        // Convert base64 to buffer
        buffer = Buffer.from(base64Data, 'base64');
        console.log(`✅ Decoded base64 image (${buffer.length} bytes, type: ${contentType})`);
      } else {
        // Regular URL - download the image
        console.log(`📥 Downloading thumbnail from URL...`);

        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }

        buffer = Buffer.from(await response.arrayBuffer());

        // Determine content type from response or default to PNG
        contentType = response.headers.get('content-type') || 'image/png';
      }

      const filePath = organizationId
        ? `organizations/${organizationId}/thumbnails/${resourceType}/${resourceId}/${filename}`
        : `thumbnails/${resourceType}/${resourceId}/${filename}`; // Fallback for legacy/migration
      console.log(`📤 Uploading thumbnail to S3: ${filePath}`);

      // Thumbnails only need CloudFront URL for display (no Transcribe needed)
      const uploadResult = await this.uploadFile(buffer, filePath, contentType);
      return uploadResult.cloudfrontUrl;
    } catch (error) {
      console.error('Thumbnail Upload Error:', error);
      throw new Error(`Failed to upload thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload a custom thumbnail image from user upload (File buffer)
   * Supports JPG and PNG formats
   *
   * @param buffer - The image buffer from user's uploaded file
   * @param resourceType - Type of content (article, podcast, video, interactive-podcast)
   * @param resourceId - ID of the resource
   * @param contentType - MIME type of the image (image/jpeg or image/png)
   * @returns CloudFront URL of the uploaded thumbnail
   *
   * @example
   * const thumbnailUrl = await storageService.uploadCustomThumbnail(
   *   fileBuffer,
   *   'article',
   *   'article-uuid-123',
   *   'image/jpeg'
   * );
   */
  async uploadCustomThumbnail(
    buffer: Buffer,
    resourceType: 'article' | 'podcast' | 'video' | 'interactive-podcast',
    resourceId: string,
    contentType: 'image/jpeg' | 'image/png',
    organizationId?: string
  ): Promise<string> {
    try {
      console.log(`📤 Uploading custom thumbnail for ${resourceType}/${resourceId}`);
      console.log(`📊 File size: ${buffer.length} bytes, type: ${contentType}`);

      // Validate content type
      if (!['image/jpeg', 'image/png'].includes(contentType)) {
        throw new Error('Invalid content type. Only JPG and PNG are supported.');
      }

      // Generate filename with timestamp to avoid caching issues
      const timestamp = Date.now();
      const extension = contentType === 'image/jpeg' ? 'jpg' : 'png';
      const filename = `custom-${timestamp}.${extension}`;
      const filePath = organizationId
        ? `organizations/${organizationId}/thumbnails/${resourceType}/${resourceId}/${filename}`
        : `thumbnails/${resourceType}/${resourceId}/${filename}`; // Fallback for legacy/migration

      // Upload to S3
      const uploadResult = await this.uploadFile(buffer, filePath, contentType);

      console.log(`✅ Custom thumbnail uploaded: ${uploadResult.cloudfrontUrl}`);
      return uploadResult.cloudfrontUrl;
    } catch (error) {
      console.error('Custom Thumbnail Upload Error:', error);
      throw new Error(`Failed to upload custom thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a signed URL with expiration (for private files)
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Signed URL Error:', error);
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get S3 URL for a file (for AWS services like Transcribe)
   * Returns direct S3 access URL, not CloudFront
   */
  getS3Url(key: string): string {
    // Use custom endpoint if configured (e.g., for S3-compatible services)
    // Otherwise use standard S3 URL format
    if (process.env.S3_ENDPOINT) {
      const endpoint = process.env.S3_ENDPOINT.replace(/\/$/, '');
      return `${endpoint}/${key}`;
    }

    // Standard AWS S3 URL format
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Get public URL for a file
   * Works for public buckets or when using CloudFlare R2 public URLs
   */
  private getPublicUrl(key: string): string {
    // For Cloudflare R2, you'd configure a custom domain
    // For S3, this would be the standard S3 URL
    const endpoint = process.env.S3_ENDPOINT || `https://${this.bucket}.s3.amazonaws.com`;
    return `${endpoint}/${key}`;
  }

  /**
   * Get CloudFront URL for a file
   * Throws error if CLOUDFRONT_BASE_URL is not configured
   */
  private getCloudfrontUrl(key: string): string {
    const cloudfrontBaseUrl = process.env.CLOUDFRONT_BASE_URL;
    if (!cloudfrontBaseUrl) {
      throw new Error('CLOUDFRONT_BASE_URL environment variable is not configured');
    }

    const cloudfrontBase = cloudfrontBaseUrl.replace(/\/$/, ''); // Remove trailing slash
    return `${cloudfrontBase}/${key}`;
  }

  /**
   * Add UUID to filename to prevent collisions
   */
  private addUuidToFilename(filePath: string): string {
    const parts = filePath.split('/');
    const filename = parts.pop() || '';
    const [name, ...extensions] = filename.split('.');
    const extension = extensions.join('.');

    const uuid = uuidv4().slice(0, 8); // Use first 8 chars of UUID
    const newFilename = extension
      ? `${name}-${uuid}.${extension}`
      : `${name}-${uuid}`;

    return [...parts, newFilename].join('/');
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(key: string): Promise<void> {
    // Implementation can be added when needed
    console.log(`Delete file: ${key}`);
  }

}

// Singleton instance
export const storageService = new StorageService();
