import { NextRequest, NextResponse } from 'next/server';
import { videoPostProcessingService } from '@/lib/services/media/video-postprocessing.service';
import { logger } from '@repo/logging';
import { v4 as uuidv4 } from 'uuid';

/**
 * Test endpoint for video post-processing (bumpers + music overlay)
 *
 * DEV ONLY - Returns 404 in production
 *
 * Usage:
 * POST /api/test/video-postprocessing
 * {
 *   "videoUrl": "https://...",           // Required - main video URL
 *   "startBumper": {                     // Optional - intro bumper
 *     "mediaUrl": "https://...",
 *     "type": "image" | "video",
 *     "duration": 3                      // Required for images
 *   },
 *   "endBumper": { ... },                // Optional - outro bumper
 *   "music": {                           // Optional - background music
 *     "audioUrl": "https://...",
 *     "volume": 0.15                     // 0-1
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  // DEV ONLY - return 404 in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const startTime = Date.now();

  try {
    const body = await request.json();
    const { videoUrl, organizationId, startBumper, endBumper, music } = body;

    // Validate required fields
    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: 'videoUrl is required' },
        { status: 400 }
      );
    }

    // Generate test IDs - use dedicated test-outputs prefix for easy cleanup
    const testVideoId = uuidv4();
    const testOrgId = organizationId || 'test-outputs';

    logger.info('Starting video post-processing test', {
      testVideoId,
      hasStartBumper: !!startBumper,
      hasEndBumper: !!endBumper,
      hasMusic: !!music,
    });

    const result = await videoPostProcessingService.processVideo({
      videoUrl,
      startBumper,
      endBumper,
      music,
      standaloneVideoId: testVideoId,
      organizationId: testOrgId,
    });

    const processingTimeMs = Date.now() - startTime;

    logger.info('Video post-processing test complete', {
      testVideoId,
      duration: result.duration,
      processingTimeMs,
      cloudfrontUrl: result.cloudfrontUrl,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        processingTimeMs,
      },
    });
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;

    logger.error('Video post-processing test failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTimeMs,
    });

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    );
  }
}
