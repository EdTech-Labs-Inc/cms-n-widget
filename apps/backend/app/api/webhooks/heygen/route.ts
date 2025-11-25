import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { config } from '@/lib/config/constants';
import { videoService } from '@/lib/services/media/video.service';
import { queueService } from '@/lib/services/core/queue.service';
import { submagicService } from '@/lib/services/external/submagic.service';
import { prisma } from '@/lib/config/database';

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

    // Find the VideoOutput record with this HeyGen video ID
    console.log(`🔍 Step 1: Looking up VideoOutput in database...`);
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
      console.error(`❌ CRITICAL: No video output found for HeyGen video ${video_id}`);
      console.error(`⚠️  This means the VideoOutput record doesn't exist or is not in PROCESSING status`);
      console.log(`⚠️  FALLBACK: Enqueueing direct processing without Submagic editing`);

      await queueService.addVideoCompletionJob({
        heygenVideoId: video_id,
        videoUrl: url,
      });

      console.log(`✅ Fallback job enqueued successfully`);
      return;
    }

    console.log(`✅ Step 1 Complete: Found VideoOutput ${videoOutput.id}`);
    console.log(`   - Title: "${videoOutput.title || 'Untitled'}"`);
    console.log(`   - Submission ID: ${videoOutput.submissionId}`);
    console.log(`   - Language: ${videoOutput.submission.language}`);

    console.log(`\n📤 Step 2: Uploading video to Submagic for AI editing...`);

    // Construct webhook URL for Submagic to call when editing completes
    const webhookUrl = `${process.env.SUBMAGIC_WEBHOOK_URL}/api/webhooks/submagic`;
    console.log(`🔔 Submagic webhook URL: ${webhookUrl}`);

    // Upload to Submagic for AI editing (captions, zooms, B-rolls)
    // Pass the submission language and custom configuration from VideoOutput
    const { projectId } = await submagicService.uploadVideoForEditing(
      url,
      webhookUrl,
      videoOutput.title || `Video ${video_id}`,
      videoOutput.submission.language, // Pass language from submission
      {
        templateName: videoOutput.submagicTemplate || 'Ella',
        enableCaptions: videoOutput.enableCaptions,
        magicZooms: videoOutput.enableMagicZooms,
        magicBrolls: videoOutput.enableMagicBrolls,
        magicBrollsPercentage: videoOutput.magicBrollsPercentage ?? 40,
      }
    );

    console.log(`✅ Step 2 Complete: Submagic project created successfully`);
    console.log(`   - Project ID: ${projectId}`);

    console.log(`\n💾 Step 3: Storing Submagic project ID in database...`);

    // Store Submagic project ID in database for webhook matching
    await prisma.videoOutput.update({
      where: { id: videoOutput.id },
      data: {
        submagicProjectId: projectId,
      },
    });

    console.log(`✅ Step 3 Complete: Database updated successfully`);
    console.log(`\n🎯 SUCCESS: All steps completed. Awaiting Submagic webhook callback...`);
    console.log(`   Next: Submagic will call ${webhookUrl} when editing is complete`);
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

  // Mark video as failed in DB
  await videoService.handleVideoFailure(video_id, msg);
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
