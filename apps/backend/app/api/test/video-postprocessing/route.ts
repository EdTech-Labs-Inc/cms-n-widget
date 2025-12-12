import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@repo/logging';
import { prisma } from '@repo/database';
import { config } from '@/lib/config/constants';
import { queueService } from '@/lib/services/core/queue.service';

/**
 * Test endpoint for video post-processing (bumpers + music overlay)
 *
 * DEV ONLY - Returns 404 in production
 *
 * POST: Create test records and queue job
 * GET: Check job status and get final video URL
 */

// POST - Create test and queue job
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

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

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required (needed for DB foreign keys)' },
        { status: 400 }
      );
    }

    // Verify organization exists
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      return NextResponse.json(
        { success: false, error: `Organization ${organizationId} not found` },
        { status: 404 }
      );
    }

    logger.info('Starting video post-processing test', {
      organizationId,
      hasStartBumper: !!startBumper,
      hasEndBumper: !!endBumper,
      hasMusic: !!music,
    });

    // Create temp bumper records if provided
    let startBumperId: string | undefined;
    let endBumperId: string | undefined;
    let backgroundMusicId: string | undefined;

    if (startBumper) {
      const bumper = await prisma.videoBumper.create({
        data: {
          name: `[TEST] Start Bumper ${Date.now()}`,
          type: startBumper.type,
          position: 'start',
          mediaUrl: startBumper.mediaUrl,
          duration: startBumper.duration,
          organizationId,
        },
      });
      startBumperId = bumper.id;
      logger.info('Created test start bumper', { id: bumper.id });
    }

    if (endBumper) {
      const bumper = await prisma.videoBumper.create({
        data: {
          name: `[TEST] End Bumper ${Date.now()}`,
          type: endBumper.type,
          position: 'end',
          mediaUrl: endBumper.mediaUrl,
          duration: endBumper.duration,
          organizationId,
        },
      });
      endBumperId = bumper.id;
      logger.info('Created test end bumper', { id: bumper.id });
    }

    if (music) {
      const musicRecord = await prisma.backgroundMusic.create({
        data: {
          name: `[TEST] Music ${Date.now()}`,
          previewAudioUrl: music.audioUrl,
          audioUrl: music.audioUrl,
          organizationId,
        },
      });
      backgroundMusicId = musicRecord.id;
      logger.info('Created test background music', { id: musicRecord.id });
    }

    // Create StandaloneVideo record
    // Note: We use dummy values for required fields since we're just testing post-processing
    const standaloneVideo = await prisma.standaloneVideo.create({
      data: {
        organizationId,
        status: 'PROCESSING',
        script: '[TEST] Post-processing test video',
        sourceType: 'prompt',
        characterId: 'test-character',
        heygenAvatarId: 'test-avatar',
        heygenCharacterType: 'avatar',
        voiceId: 'test-voice',
        // Bumpers & Music
        startBumperId,
        startBumperDuration: startBumper?.duration,
        endBumperId,
        endBumperDuration: endBumper?.duration,
        backgroundMusicId,
        backgroundMusicVolume: music?.volume ?? 0.15,
        environment: config.appEnvironment,
      },
    });

    logger.info('Created test StandaloneVideo', { id: standaloneVideo.id });

    // Queue the post-processing job
    const job = await queueService.addStandaloneVideoPostProcessingJob({
      standaloneVideoId: standaloneVideo.id,
      organizationId,
      editedVideoUrl: videoUrl,
    });

    logger.info('Queued post-processing job', {
      jobId: job.id,
      standaloneVideoId: standaloneVideo.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        standaloneVideoId: standaloneVideo.id,
        message: 'Job queued. Use GET /api/test/video-postprocessing?id=<standaloneVideoId> to check status.',
      },
    });
  } catch (error) {
    logger.error('Video post-processing test failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to queue job' },
      { status: 500 }
    );
  }
}

// GET - Check status and get video URL
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const standaloneVideoId = searchParams.get('id');

  if (!standaloneVideoId) {
    return NextResponse.json(
      { success: false, error: 'Missing id parameter' },
      { status: 400 }
    );
  }

  try {
    const standaloneVideo = await prisma.standaloneVideo.findUnique({
      where: { id: standaloneVideoId },
      select: {
        id: true,
        status: true,
        videoUrl: true,
        duration: true,
        error: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!standaloneVideo) {
      return NextResponse.json(
        { success: false, error: 'StandaloneVideo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: standaloneVideo.id,
        status: standaloneVideo.status,
        videoUrl: standaloneVideo.videoUrl,
        duration: standaloneVideo.duration,
        error: standaloneVideo.error,
        createdAt: standaloneVideo.createdAt,
        updatedAt: standaloneVideo.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Failed to get test video status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      standaloneVideoId,
    });

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get status' },
      { status: 500 }
    );
  }
}
