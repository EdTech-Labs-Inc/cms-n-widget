import { NextRequest, NextResponse } from 'next/server';
import { avatarCacheService } from '@/lib/services/cache/avatar-cache.service';
import { logger } from '@repo/logging';

/**
 * GET /api/heygen/avatars
 *
 * Returns a paginated list of available HeyGen avatars and talking photos.
 * Data is cached server-side for 24 hours to minimize API calls to HeyGen.
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 12)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     avatars: ProcessedAvatar[],
 *     pagination: {
 *       page: number,
 *       limit: number,
 *       total: number,
 *       totalPages: number
 *     }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  console.log('🎭 [HeyGen Avatars API] GET request received');
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));

    console.log('🎭 [HeyGen Avatars API] Params:', { page, limit });
    logger.info('Fetching HeyGen avatars', { page, limit });

    // Get all avatars from cache (or fetch if cache miss)
    console.log('🎭 [HeyGen Avatars API] Calling avatarCacheService.getAvatars()...');
    const allAvatars = await avatarCacheService.getAvatars();
    console.log('🎭 [HeyGen Avatars API] Got avatars from cache:', allAvatars.length);

    // Apply server-side pagination
    const total = allAvatars.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedAvatars = allAvatars.slice(skip, skip + limit);

    logger.info('Returning paginated avatars', {
      page,
      limit,
      total,
      totalPages,
      returnedCount: paginatedAvatars.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        avatars: paginatedAvatars,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to fetch HeyGen avatars', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch avatars',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/heygen/avatars
 *
 * Force refresh the avatar cache. Useful for manual cache invalidation.
 *
 * Response:
 * {
 *   success: true,
 *   message: "Cache refreshed successfully",
 *   data: {
 *     totalAvatars: number,
 *     cacheStats: {...}
 *   }
 * }
 */
export async function POST() {
  try {
    logger.info('Refreshing HeyGen avatar cache');

    const avatars = await avatarCacheService.refreshCache();
    const cacheStats = avatarCacheService.getCacheStats();

    return NextResponse.json({
      success: true,
      message: 'Cache refreshed successfully',
      data: {
        totalAvatars: avatars.length,
        cacheStats,
      },
    });
  } catch (error) {
    logger.error('Failed to refresh avatar cache', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh cache',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
