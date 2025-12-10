import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { config } from '@/lib/config/constants';
import { videoWebhookService as videoService } from '@/lib/services/media/video-webhook.service';
import { queueService } from '@/lib/services/core/queue.service';
import { submagicService } from '@/lib/services/external/submagic.service';
import { prisma } from '@/lib/config/database';

/**
 * Handle successful video generation for VideoOutput (submission-based)
 * Uploads video to Submagic for AI editing (captions, zooms, B-rolls)
 */
async function handleVideoOutputSuccess(video_id: string, url: string): Promise<boolean> {
  // Find the VideoOutput record with this HeyGen video ID
  console.log(`🔍 Looking up VideoOutput in database...`);
  const videoOutput = await prisma.videoOutput.findFirst({
    where: {
      heygenVideoId: video_id,
      status: 'PROCESSING',
    },
    include: {
      submission: true, // Include submission to get language
    },
  });

  if (!videoOutput) {
    return false; // Not a VideoOutput, try StandaloneVideo
  }

  console.log(`✅ Found VideoOutput ${videoOutput.id}`);
  console.log(`   - Title: "${videoOutput.title || 'Untitled'}"`);
  console.log(`   - Submission ID: ${videoOutput.submissionId}`);
  console.log(`   - Language: ${videoOutput.submission.language}`);

  console.log(`\n📤 Uploading video to Submagic for AI editing...`);

  // Construct webhook URL for Submagic to call when editing completes
  const webhookUrl = `${process.env.SUBMAGIC_WEBHOOK_URL}/api/webhooks/submagic`;
  console.log(`🔔 Submagic webhook URL: ${webhookUrl}`);

  // Log caption template configuration
  console.log(`📝 CAPTION TEMPLATE CONFIG (VideoOutput):`);
  console.log(`   - User Theme ID: '9a3c5f9f-a496-41d0-a104-b1e6dad84d89' (default)`);
  console.log(`   - Enable Captions: true`);
  console.log(`   - Magic Zooms: ${videoOutput.enableMagicZooms}`);
  console.log(`   - Magic B-Rolls: ${videoOutput.enableMagicBrolls} (${videoOutput.magicBrollsPercentage ?? 40}%)`);

  // Upload to Submagic for AI editing (captions, zooms, B-rolls)
  const { projectId } = await submagicService.uploadVideoForEditing(
    url,
    webhookUrl,
    videoOutput.title || `Video ${video_id}`,
    videoOutput.submission.language,
    {
      userThemeId: '9a3c5f9f-a496-41d0-a104-b1e6dad84d89', // Default theme
      enableCaptions: true, // Always enabled
      magicZooms: videoOutput.enableMagicZooms,
      magicBrolls: videoOutput.enableMagicBrolls,
      magicBrollsPercentage: videoOutput.magicBrollsPercentage ?? 40,
    }
  );

  console.log(`✅ Submagic project created: ${projectId}`);

  // Store Submagic project ID in database for webhook matching
  await prisma.videoOutput.update({
    where: { id: videoOutput.id },
    data: {
      submagicProjectId: projectId,
    },
  });

  console.log(`✅ Database updated. Awaiting Submagic webhook callback...`);
  return true;
}

/**
 * Handle successful video generation for StandaloneVideo
 * Uploads video to Submagic for AI editing, then post-processing adds bumpers/music
 */
async function handleStandaloneVideoSuccess(video_id: string, url: string): Promise<boolean> {
  // Find the StandaloneVideo record with this HeyGen video ID
  console.log(`🔍 Looking up StandaloneVideo in database...`);
  const standaloneVideo = await prisma.standaloneVideo.findFirst({
    where: {
      heygenVideoId: video_id,
      status: 'PROCESSING',
    },
    include: {
      captionStyle: true, // Include caption style for Submagic template
    },
  });

  if (!standaloneVideo) {
    return false; // Not a StandaloneVideo either
  }

  console.log(`✅ Found StandaloneVideo ${standaloneVideo.id}`);
  console.log(`   - Title: "${standaloneVideo.title || 'Untitled'}"`);
  console.log(`   - Caption Style: ${standaloneVideo.captionStyle?.name || 'None'}`);
  console.log(`   - Magic Zooms: ${standaloneVideo.enableMagicZooms}`);
  console.log(`   - Magic B-Rolls: ${standaloneVideo.enableMagicBrolls} (${standaloneVideo.magicBrollsPercentage}%)`);

  console.log(`\n📤 Uploading video to Submagic for AI editing...`);

  // Construct webhook URL for Submagic to call when editing completes
  const webhookUrl = `${process.env.SUBMAGIC_WEBHOOK_URL}/api/webhooks/submagic`;
  console.log(`🔔 Submagic webhook URL: ${webhookUrl}`);

  // Get the userThemeId from caption style, or use default
  const userThemeId = standaloneVideo.captionStyle?.submagicTemplate || '9a3c5f9f-a496-41d0-a104-b1e6dad84d89';

  // Log caption template configuration
  console.log(`📝 CAPTION TEMPLATE CONFIG (StandaloneVideo):`);
  console.log(`   - Caption Style ID: ${standaloneVideo.captionStyleId || 'none'}`);
  console.log(`   - Caption Style Name: ${standaloneVideo.captionStyle?.name || 'none'}`);
  console.log(`   - Raw submagicTemplate value: ${standaloneVideo.captionStyle?.submagicTemplate || 'null'}`);
  console.log(`   - Resolved User Theme ID: ${userThemeId} (fallback to default if null)`);
  console.log(`   - Enable Captions: true`);
  console.log(`   - Magic Zooms: ${standaloneVideo.enableMagicZooms}`);
  console.log(`   - Magic B-Rolls: ${standaloneVideo.enableMagicBrolls} (${standaloneVideo.magicBrollsPercentage}%)`);

  // Upload to Submagic for AI editing (captions, zooms, B-rolls)
  // StandaloneVideos default to English for now
  const { projectId } = await submagicService.uploadVideoForEditing(
    url,
    webhookUrl,
    standaloneVideo.title || `Video ${video_id}`,
    'ENGLISH', // StandaloneVideos are English by default
    {
      userThemeId,
      enableCaptions: true, // Always enabled
      magicZooms: standaloneVideo.enableMagicZooms,
      magicBrolls: standaloneVideo.enableMagicBrolls,
      magicBrollsPercentage: standaloneVideo.magicBrollsPercentage,
    }
  );

  console.log(`✅ Submagic project created: ${projectId}`);

  // Store Submagic project ID in database for webhook matching
  await prisma.standaloneVideo.update({
    where: { id: standaloneVideo.id },
    data: {
      submagicProjectId: projectId,
    },
  });

  console.log(`✅ Database updated. Awaiting Submagic webhook callback...`);
  console.log(`   Note: After Submagic completes, post-processing will add bumpers/music if configured`);
  return true;
}

/**
 * Handle successful video generation
 * Uploads video to Submagic for AI editing (captions, zooms, B-rolls)
 */
async function handleVideoSuccess(eventData: {
  video_id: string;
  url: string;
  callback_id?: string;
  gif_download_url?: string;
}) {
  const { video_id, url, callback_id } = eventData;

  console.log(`🎉 Video ${video_id} completed successfully`);
  console.log(`📹 Video URL: ${url}`);

  if (callback_id) {
    console.log(`🔗 Callback ID: ${callback_id}`);
  }

  try {
    console.log('==========================================');
    console.log('🎬 HEYGEN WEBHOOK - VIDEO SUCCESS HANDLER');
    console.log(`Video ID: ${video_id}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('==========================================');

    // Try VideoOutput first (submission-based videos)
    const handledAsVideoOutput = await handleVideoOutputSuccess(video_id, url);
    if (handledAsVideoOutput) {
      console.log('==========================================\n');
      return;
    }

    // Try StandaloneVideo next (standalone create page videos)
    const handledAsStandaloneVideo = await handleStandaloneVideoSuccess(video_id, url);
    if (handledAsStandaloneVideo) {
      console.log('==========================================\n');
      return;
    }

    // Neither found - fallback to direct processing
    console.error(`❌ No VideoOutput or StandaloneVideo found for HeyGen video ${video_id}`);
    console.log(`⚠️  FALLBACK: Enqueueing direct processing without Submagic editing`);

    await queueService.addVideoCompletionJob({
      heygenVideoId: video_id,
      videoUrl: url,
    });

    console.log(`✅ Fallback job enqueued successfully`);
    console.log('==========================================\n');
  } catch (error) {
    console.error('==========================================');
    console.error('❌ SUBMAGIC UPLOAD FAILED');
    console.error(`Video ID: ${video_id}`);
    console.error(`Timestamp: ${new Date().toISOString()}`);
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    if (error instanceof Error && error.stack) {
      console.error(`Stack trace:\n${error.stack}`);
    }
    console.error('==========================================');

    console.log(`\n⚠️  FALLBACK ACTIVATED: Enqueueing direct processing without Submagic editing`);

    try {
      // Fallback: enqueue direct processing without Submagic
      await queueService.addVideoCompletionJob({
        heygenVideoId: video_id,
        videoUrl: url,
      });

      console.log(`✅ Fallback job enqueued successfully - video will process without AI editing`);
      console.log('==========================================\n');
    } catch (fallbackError) {
      console.error(`❌ CRITICAL: Fallback job enqueueing also failed!`);
      console.error(`Error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      console.error('==========================================\n');
      throw fallbackError; // Re-throw to trigger 500 response
    }
  }
}

/**
 * Handle failed video generation
 */
async function handleVideoFailure(eventData: {
  video_id: string;
  msg: string;
  callback_id?: string;
}) {
  const { video_id, msg, callback_id } = eventData;

  console.error(`❌ Video ${video_id} failed: ${msg}`);

  if (callback_id) {
    console.log(`🔗 Callback ID: ${callback_id}`);
  }

  // Try VideoOutput first
  const videoOutputHandled = await videoService.handleVideoFailure(video_id, msg);

  // If not a VideoOutput, try StandaloneVideo
  if (!videoOutputHandled) {
    console.log(`🔍 Checking for StandaloneVideo...`);
    const standaloneVideo = await prisma.standaloneVideo.findFirst({
      where: {
        heygenVideoId: video_id,
        status: 'PROCESSING',
      },
    });

    if (standaloneVideo) {
      console.log(`✅ Found StandaloneVideo ${standaloneVideo.id}, marking as FAILED`);
      await prisma.standaloneVideo.update({
        where: { id: standaloneVideo.id },
        data: {
          status: 'FAILED',
          error: msg,
        },
      });
    } else {
      console.error(`❌ No VideoOutput or StandaloneVideo found for failed HeyGen video ${video_id}`);
    }
  }
}

/**
 * POST /api/webhooks/heygen - HeyGen video completion webhook
 *
 * Receives notifications when video generation completes
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Verify webhook signature
    const signature = request.headers.get('signature');
    const webhookSecret = config.heygen.webhookSecret;

    if (!webhookSecret) {
      console.error('⚠️  HeyGen webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Get raw body as string for signature verification
    const rawBody = JSON.stringify(body);

    // Verify signature using HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('✅ HeyGen webhook signature verified');

    // Step 2: Parse webhook payload
    const { event_type, event_data } = body;

    console.log(`📨 HeyGen webhook event: ${event_type}`, event_data);

    // Step 3: Handle different event types
    switch (event_type) {
      case 'avatar_video.success':
        await handleVideoSuccess(event_data);
        break;

      case 'avatar_video.fail':
        await handleVideoFailure(event_data);
        break;

      default:
        console.log(`⚠️  Unhandled event type: ${event_type}`);
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('HeyGen Webhook Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/webhooks/heygen - Required for HeyGen webhook validation
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, signature',
    },
  });
}
