import { logger } from '@repo/logging';
import {
  heygenService,
  ProcessedAvatar,
  HeyGenApiAvatar,
  HeyGenApiTalkingPhoto,
} from '../external/heygen.service';

interface AvatarCache {
  data: ProcessedAvatar[];
  timestamp: number;
  expiresAt: number;
}

/**
 * Avatar Cache Service
 *
 * Caches avatars fetched from HeyGen API with 24-hour expiration.
 * Reduces API calls and improves response times for the avatar selection UI.
 */
class AvatarCacheService {
  private cache: AvatarCache | null = null;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private fetchPromise: Promise<ProcessedAvatar[]> | null = null;

  /**
   * Get all avatars, either from cache or by fetching from HeyGen
   */
  async getAvatars(): Promise<ProcessedAvatar[]> {
    console.log('🎭 [AvatarCache] getAvatars() called');

    // Return cached data if still valid
    if (this.isCacheValid()) {
      console.log('🎭 [AvatarCache] Cache HIT - returning', this.cache!.data.length, 'avatars');
      logger.debug('Avatar cache hit', {
        cachedCount: this.cache!.data.length,
        expiresIn: Math.round((this.cache!.expiresAt - Date.now()) / 1000 / 60) + ' minutes',
      });
      return this.cache!.data;
    }

    // Prevent concurrent fetches - if already fetching, wait for that result
    if (this.fetchPromise) {
      console.log('🎭 [AvatarCache] Fetch already in progress, waiting...');
      logger.debug('Avatar fetch already in progress, waiting...');
      return this.fetchPromise;
    }

    // Fetch fresh data
    console.log('🎭 [AvatarCache] Cache MISS - fetching from HeyGen API...');
    logger.info('Avatar cache miss, fetching from HeyGen API');
    this.fetchPromise = this.fetchAndCacheAvatars();

    try {
      const result = await this.fetchPromise;
      return result;
    } finally {
      this.fetchPromise = null;
    }
  }

  /**
   * Force refresh the cache (for manual invalidation)
   */
  async refreshCache(): Promise<ProcessedAvatar[]> {
    logger.info('Manually refreshing avatar cache');
    this.invalidateCache();
    return this.getAvatars();
  }

  /**
   * Invalidate the cache (next request will fetch fresh data)
   */
  invalidateCache(): void {
    logger.info('Avatar cache invalidated');
    this.cache = null;
  }

  /**
   * Check if the cache exists and is still valid
   */
  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() < this.cache.expiresAt;
  }

  /**
   * Fetch avatars from HeyGen and store in cache
   */
  private async fetchAndCacheAvatars(): Promise<ProcessedAvatar[]> {
    try {
      console.log('🎭 [AvatarCache] Calling heygenService.listAvatars()...');
      const response = await heygenService.listAvatars();
      console.log('🎭 [AvatarCache] HeyGen response received:', {
        hasData: !!response.data,
        avatarCount: response.data?.avatars?.length ?? 0,
        talkingPhotoCount: response.data?.talking_photos?.length ?? 0,
      });

      const avatars = response.data?.avatars || [];
      const talkingPhotos = response.data?.talking_photos || [];

      // Process and normalize avatars for frontend consumption
      const processedAvatars = this.processAvatars(avatars, talkingPhotos);

      // Update cache
      const now = Date.now();
      this.cache = {
        data: processedAvatars,
        timestamp: now,
        expiresAt: now + this.CACHE_DURATION,
      };

      logger.info('Avatar cache updated', {
        totalAvatars: processedAvatars.length,
        avatarCount: avatars.length,
        talkingPhotoCount: talkingPhotos.length,
        expiresAt: new Date(this.cache.expiresAt).toISOString(),
      });

      return processedAvatars;
    } catch (error) {
      console.error('🎭 [AvatarCache] ERROR fetching avatars:', error);
      logger.error('Failed to fetch and cache avatars', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // If we have stale cache data, return it rather than failing
      if (this.cache) {
        console.log('🎭 [AvatarCache] Returning stale cache data due to error');
        logger.warn('Returning stale cache data due to fetch error');
        return this.cache.data;
      }

      throw error;
    }
  }

  /**
   * Process raw HeyGen API responses into normalized ProcessedAvatar format
   * Note: Voice ID is NOT fetched here - it's fetched on-demand during video generation
   */
  private processAvatars(
    avatars: HeyGenApiAvatar[],
    talkingPhotos: HeyGenApiTalkingPhoto[]
  ): ProcessedAvatar[] {
    const processed: ProcessedAvatar[] = [];

    // Process avatars - voice will be fetched when user selects for video generation
    for (const avatar of avatars) {
      processed.push({
        id: avatar.avatar_id,
        name: avatar.avatar_name,
        type: 'avatar',
        previewUrl: avatar.preview_image_url,
        voiceId: '', // Will be fetched on-demand during video generation
      });
    }

    // Process talking photos
    for (const photo of talkingPhotos) {
      processed.push({
        id: photo.talking_photo_id,
        name: photo.talking_photo_name,
        type: 'talking_photo',
        previewUrl: photo.preview_image_url,
        voiceId: '', // Will be fetched on-demand during video generation
      });
    }

    console.log(`🎭 [AvatarCache] Processed ${processed.length} total avatars/photos`);
    return processed;
  }

  /**
   * Get cache statistics (for debugging/monitoring)
   */
  getCacheStats(): {
    isCached: boolean;
    itemCount: number;
    cachedAt: string | null;
    expiresAt: string | null;
    remainingMs: number | null;
  } {
    if (!this.cache) {
      return {
        isCached: false,
        itemCount: 0,
        cachedAt: null,
        expiresAt: null,
        remainingMs: null,
      };
    }

    return {
      isCached: true,
      itemCount: this.cache.data.length,
      cachedAt: new Date(this.cache.timestamp).toISOString(),
      expiresAt: new Date(this.cache.expiresAt).toISOString(),
      remainingMs: Math.max(0, this.cache.expiresAt - Date.now()),
    };
  }
}

// Singleton instance
export const avatarCacheService = new AvatarCacheService();
