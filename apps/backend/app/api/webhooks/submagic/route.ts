import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/database';
import { queueService } from '@/lib/services/core/queue.service';

/**
 * Handle successful video editing from Submagic
 * Enqueues background job for processing (transcription, bubble generation)
 */
async function handleEditingSuccess(eventData: {
  id: string; // Submagic project ID
  videoUrl?: string;
  status?: string;
  [key: string]: any;
}) {
  const { id: projectId, videoUrl } = eventData;

  console.log('==========================================');
  console.log('🎨 SUBMAGIC WEBHOOK - EDITING SUCCESS');
  console.log(`Project ID: ${projectId}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('==========================================');

  console.log(`📹 Edited Video URL: ${videoUrl || 'NOT PROVIDED'}`);

  if (!videoUrl) {
    console.error(`❌ CRITICAL: No video URL provided in Submagic webhook`);
    console.error(`   Cannot proceed without edited video URL`);
    console.error('==========================================\n');
    return;
  }

  console.log(`\n🔍 Step 1: Looking up VideoOutput by Submagic project ID...`);

  // Find the VideoOutput record with this Submagic project ID
  const videoOutput = await prisma.videoOutput.findFirst({
    where: {
      submagicProjectId: projectId,
    },
  });

  if (!videoOutput) {
    console.error(`❌ CRITICAL: No video output found for Submagic project ${projectId}`);
    console.error(`   This means the database has no record with this submagicProjectId`);
    console.error(`   Check if HeyGen webhook properly stored the project ID`);
    console.error('==========================================\n');
    return;
  }

  console.log(`✅ Step 1 Complete: Found VideoOutput ${videoOutput.id}`);
  console.log(`   - Title: "${videoOutput.title || 'Untitled'}"`);
  console.log(`   - HeyGen Video ID: ${videoOutput.heygenVideoId || 'MISSING'}`);
  console.log(`   - Submission ID: ${videoOutput.submissionId}`);

  if (!videoOutput.heygenVideoId) {
    console.error(`\n❌ CRITICAL: Video output ${videoOutput.id} has no HeyGen video ID`);
    console.error(`   Cannot proceed without HeyGen video ID for tracking`);
    console.error('==========================================\n');
    return;
  }

  console.log(`\n📋 Step 2: Enqueueing video completion job...`);
  console.log(`   - Using edited video from Submagic`);
  console.log(`   - Will process: download → S3 upload → transcribe → generate bubbles`);

  // Enqueue background job to process edited video
  // (download, upload to S3, transcribe, generate bubbles)
  await queueService.addVideoCompletionJob({
    heygenVideoId: videoOutput.heygenVideoId,
    videoUrl: videoUrl, // Use Submagic edited video URL instead of raw HeyGen URL
  });

  console.log(`✅ Step 2 Complete: Job enqueued successfully`);
  console.log(`\n🎯 SUCCESS: Submagic webhook processed successfully`);
  console.log(`   Next: Worker will process the edited video`);
  console.log('==========================================\n');
}

/**
 * Handle failed video editing from Submagic
 */
async function handleEditingFailure(eventData: {
  id: string; // Submagic project ID
  error?: string;
  status?: string;
  [key: string]: any;
}) {
  const { id: projectId, error: errorMessage } = eventData;

  console.error('==========================================');
  console.error('❌ SUBMAGIC WEBHOOK - EDITING FAILED');
  console.error(`Project ID: ${projectId}`);
  console.error(`Timestamp: ${new Date().toISOString()}`);
  console.error(`Error: ${errorMessage || 'Unknown error'}`);
  console.error('==========================================');

  console.log(`\n🔍 Step 1: Looking up VideoOutput by Submagic project ID...`);

  // Find the VideoOutput record with this Submagic project ID
  const videoOutput = await prisma.videoOutput.findFirst({
    where: {
      submagicProjectId: projectId,
    },
  });

  if (!videoOutput) {
    console.error(`❌ CRITICAL: No video output found for Submagic project ${projectId}`);
    console.error(`   Cannot mark video as failed - no matching record in database`);
    console.error('==========================================\n');
    return;
  }

  console.log(`✅ Step 1 Complete: Found VideoOutput ${videoOutput.id}`);
  console.log(`   - Title: "${videoOutput.title || 'Untitled'}"`);
  console.log(`   - Submission ID: ${videoOutput.submissionId}`);

  console.log(`\n💾 Step 2: Marking video as FAILED in database...`);

  // Update VideoOutput to FAILED status
  await prisma.videoOutput.update({
    where: { id: videoOutput.id },
    data: {
      status: 'FAILED',
      error: `Submagic editing failed: ${errorMessage || 'Unknown error'}`,
    },
  });

  console.log(`✅ Step 2 Complete: VideoOutput marked as FAILED`);

  console.log(`\n📊 Step 3: Updating submission status...`);

  // Update submission status
  const { submissionService } = await import('@/lib/services/submission.service');
  await submissionService.updateSubmissionStatus(videoOutput.submissionId);

  console.log(`✅ Step 3 Complete: Submission status updated`);
  console.error(`\n⚠️  FAILURE HANDLED: Video marked as failed, user will be notified`);
  console.error('==========================================\n');
}

/**
 * POST /api/webhooks/submagic - Submagic video editing completion webhook
 *
 * Receives notifications when video editing completes
 */
export async function POST(request: NextRequest) {
  console.log('\n📨 ========== SUBMAGIC WEBHOOK RECEIVED ==========');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  try {
    const body = await request.json();

    console.log(`📦 Raw payload:`, JSON.stringify(body, null, 2));

    // Submagic webhook payload structure (actual format):
    // When successful: { projectId: "...", status: "completed", downloadUrl: "...", directUrl: "..." }
    // When failed: { projectId: "...", status: "failed", error: "..." }

    const { projectId, id, status, downloadUrl, directUrl, videoUrl, error } = body;

    // Use projectId if available, fallback to id for compatibility
    const actualProjectId = projectId || id;

    if (!actualProjectId) {
      console.error('❌ VALIDATION ERROR: No project ID in Submagic webhook payload');
      console.error('   Payload must include "projectId" or "id" field');
      console.error('================================================\n');
      return NextResponse.json(
        { error: 'Missing project ID' },
        { status: 400 }
      );
    }

    console.log(`✅ Project ID: ${actualProjectId}`);
    console.log(`📊 Status: ${status || 'not provided'}`);

    // Use directUrl (CDN) if available, fallback to downloadUrl, then videoUrl
    const actualVideoUrl = directUrl || downloadUrl || videoUrl;

    // Handle different statuses
    if (status === 'completed' || actualVideoUrl) {
      // Success case
      console.log(`✅ Detected SUCCESS event - video editing completed`);
      // Pass modified payload with normalized field names
      await handleEditingSuccess({
        ...body,
        id: actualProjectId,
        videoUrl: actualVideoUrl,
      });
    } else if (status === 'failed' || error) {
      // Failure case
      console.log(`⚠️  Detected FAILURE event - video editing failed`);
      await handleEditingFailure({
        ...body,
        id: actualProjectId,
      });
    } else {
      console.log(`⚠️  UNHANDLED STATUS: "${status}"`);
      console.log(`   Expected "completed" or "failed", or presence of downloadUrl/directUrl/videoUrl/error`);
      console.log(`   Acknowledging webhook but taking no action`);
    }

    console.log(`✅ Webhook acknowledged successfully`);
    console.log('================================================\n');

    // Return 200 to acknowledge receipt
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('================================================');
    console.error('❌ SUBMAGIC WEBHOOK ERROR');
    console.error(`Timestamp: ${new Date().toISOString()}`);
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    if (error instanceof Error && error.stack) {
      console.error(`Stack trace:\n${error.stack}`);
    }
    console.error('================================================\n');

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/webhooks/submagic - Required for webhook validation
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
