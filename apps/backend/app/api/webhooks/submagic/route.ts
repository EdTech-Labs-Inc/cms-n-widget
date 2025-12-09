import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/database';
import { queueService } from '@/lib/services/core/queue.service';

/**
 * Handle successful video editing from Submagic for VideoOutput
 * Returns true if VideoOutput was found and processed
 */
async function handleVideoOutputEditingSuccess(projectId: string, videoUrl: string): Promise<boolean> {
  // Find the VideoOutput record with this Submagic project ID
  const videoOutput = await prisma.videoOutput.findFirst({
    where: {
      submagicProjectId: projectId,
    },
  });

  if (!videoOutput) {
    return false; // Not a VideoOutput, try StandaloneVideo
  }

  console.log(`✅ Found VideoOutput ${videoOutput.id}`);
  console.log(`   - Title: "${videoOutput.title || 'Untitled'}"`);
  console.log(`   - HeyGen Video ID: ${videoOutput.heygenVideoId || 'MISSING'}`);
  console.log(`   - Submission ID: ${videoOutput.submissionId}`);

  // Log the original config that was used
  console.log(`📝 ORIGINAL CONFIG USED:`);
  console.log(`   - Template: ${videoOutput.submagicTemplate || 'jblk (hardcoded)'}`);
  console.log(`   - Magic Zooms: ${videoOutput.enableMagicZooms}`);
  console.log(`   - Magic B-Rolls: ${videoOutput.enableMagicBrolls} (${videoOutput.magicBrollsPercentage ?? 40}%)`);

  if (!videoOutput.heygenVideoId) {
    console.error(`\n❌ CRITICAL: Video output ${videoOutput.id} has no HeyGen video ID`);
    console.error(`   Cannot proceed without HeyGen video ID for tracking`);
    return true; // We found it but can't process it
  }

  console.log(`\n📋 Enqueueing video completion job...`);
  console.log(`   - Using edited video from Submagic`);
  console.log(`   - Will process: download → S3 upload → transcribe → generate bubbles`);

  // Enqueue background job to process edited video
  await queueService.addVideoCompletionJob({
    heygenVideoId: videoOutput.heygenVideoId,
    videoUrl: videoUrl,
  });

  console.log(`✅ Job enqueued successfully`);
  return true;
}

/**
 * Handle successful video editing from Submagic for StandaloneVideo
 * Queues post-processing for bumpers/music if configured
 * Returns true if StandaloneVideo was found and processed
 */
async function handleStandaloneVideoEditingSuccess(projectId: string, videoUrl: string): Promise<boolean> {
  // Find the StandaloneVideo record with this Submagic project ID
  const standaloneVideo = await prisma.standaloneVideo.findFirst({
    where: {
      submagicProjectId: projectId,
    },
    include: {
      backgroundMusic: true,
      startBumper: true,
      endBumper: true,
      captionStyle: true, // Include for logging original template config
    },
  });

  if (!standaloneVideo) {
    return false; // Not a StandaloneVideo either
  }

  console.log(`✅ Found StandaloneVideo ${standaloneVideo.id}`);
  console.log(`   - Title: "${standaloneVideo.title || 'Untitled'}"`);
  console.log(`   - Has Start Bumper: ${!!standaloneVideo.startBumper}`);
  console.log(`   - Has End Bumper: ${!!standaloneVideo.endBumper}`);
  console.log(`   - Has Background Music: ${!!standaloneVideo.backgroundMusic}`);

  // Log the original config that was used
  console.log(`📝 ORIGINAL CONFIG USED:`);
  console.log(`   - Caption Style ID: ${standaloneVideo.captionStyleId || 'none'}`);
  console.log(`   - Caption Style Name: ${standaloneVideo.captionStyle?.name || 'none'}`);
  console.log(`   - Template: ${standaloneVideo.captionStyle?.submagicTemplate || 'jblk (default)'}`);
  console.log(`   - Magic Zooms: ${standaloneVideo.enableMagicZooms}`);
  console.log(`   - Magic B-Rolls: ${standaloneVideo.enableMagicBrolls} (${standaloneVideo.magicBrollsPercentage}%)`);

  // Always queue post-processing job - this ensures upload happens in worker context
  // (which has proper S3 permissions) and handles bumpers/music if configured
  const hasBumpersOrMusic =
    standaloneVideo.startBumper ||
    standaloneVideo.endBumper ||
    standaloneVideo.backgroundMusic;

  console.log(`\n📋 Enqueueing post-processing job...`);
  if (hasBumpersOrMusic) {
    console.log(`   Will add: ${standaloneVideo.startBumper ? 'start bumper, ' : ''}${standaloneVideo.endBumper ? 'end bumper, ' : ''}${standaloneVideo.backgroundMusic ? 'background music' : ''}`);
  } else {
    console.log(`   No bumpers/music - will upload video directly`);
  }

  // Queue post-processing job (handles upload to S3 in worker context)
  await queueService.addStandaloneVideoPostProcessingJob({
    standaloneVideoId: standaloneVideo.id,
    organizationId: standaloneVideo.organizationId,
    editedVideoUrl: videoUrl,
  });

  console.log(`✅ Post-processing job enqueued successfully`);
  console.log(`   Next: Worker will process and upload final video`);

  return true;
}

/**
 * Handle successful video editing from Submagic
 * Enqueues background job for processing (transcription, bubble generation)
 */
async function handleEditingSuccess(eventData: {
  id: string; // Submagic project ID
  videoUrl?: string;
  status?: string;
  directUrl?: string;
  downloadUrl?: string;
  [key: string]: any;
}) {
  const { id: projectId, videoUrl, directUrl, downloadUrl, status } = eventData;

  console.log('==========================================');
  console.log('🎨 SUBMAGIC WEBHOOK - EDITING SUCCESS');
  console.log(`Project ID: ${projectId}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('==========================================');

  // Log detailed result information
  console.log(`📹 SUBMAGIC RESULT:`);
  console.log(`   - Project ID: ${projectId}`);
  console.log(`   - Status: ${status || 'completed'}`);
  console.log(`   - Edited Video URL: ${videoUrl || 'NOT PROVIDED'}`);
  console.log(`   - Direct URL: ${directUrl || 'N/A'}`);
  console.log(`   - Download URL: ${downloadUrl || 'N/A'}`);

  if (!videoUrl) {
    console.error(`❌ CRITICAL: No video URL provided in Submagic webhook`);
    console.error(`   Cannot proceed without edited video URL`);
    console.error('==========================================\n');
    return;
  }

  // Try VideoOutput first (submission-based videos)
  console.log(`\n🔍 Looking up VideoOutput by Submagic project ID...`);
  const handledAsVideoOutput = await handleVideoOutputEditingSuccess(projectId, videoUrl);
  if (handledAsVideoOutput) {
    console.log(`\n🎯 SUCCESS: Submagic webhook processed successfully (VideoOutput)`);
    console.log('==========================================\n');
    return;
  }

  // Try StandaloneVideo next
  console.log(`\n🔍 Looking up StandaloneVideo by Submagic project ID...`);
  const handledAsStandaloneVideo = await handleStandaloneVideoEditingSuccess(projectId, videoUrl);
  if (handledAsStandaloneVideo) {
    console.log(`\n🎯 SUCCESS: Submagic webhook processed successfully (StandaloneVideo)`);
    console.log('==========================================\n');
    return;
  }

  // Neither found
  console.error(`❌ CRITICAL: No VideoOutput or StandaloneVideo found for Submagic project ${projectId}`);
  console.error(`   This means the database has no record with this submagicProjectId`);
  console.error(`   Check if HeyGen webhook properly stored the project ID`);
  console.error('==========================================\n');
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

  // Try VideoOutput first
  console.log(`\n🔍 Looking up VideoOutput by Submagic project ID...`);
  const videoOutput = await prisma.videoOutput.findFirst({
    where: {
      submagicProjectId: projectId,
    },
  });

  if (videoOutput) {
    console.log(`✅ Found VideoOutput ${videoOutput.id}`);
    console.log(`   - Title: "${videoOutput.title || 'Untitled'}"`);
    console.log(`   - Submission ID: ${videoOutput.submissionId}`);

    console.log(`\n💾 Marking video as FAILED in database...`);

    // Update VideoOutput to FAILED status
    await prisma.videoOutput.update({
      where: { id: videoOutput.id },
      data: {
        status: 'FAILED',
        error: `Submagic editing failed: ${errorMessage || 'Unknown error'}`,
      },
    });

    console.log(`✅ VideoOutput marked as FAILED`);

    // Update submission status
    const { submissionService } = await import('@/lib/services/submission.service');
    await submissionService.updateSubmissionStatus(videoOutput.submissionId);

    console.log(`✅ Submission status updated`);
    console.error(`\n⚠️  FAILURE HANDLED: Video marked as failed, user will be notified`);
    console.error('==========================================\n');
    return;
  }

  // Try StandaloneVideo next
  console.log(`\n🔍 Looking up StandaloneVideo by Submagic project ID...`);
  const standaloneVideo = await prisma.standaloneVideo.findFirst({
    where: {
      submagicProjectId: projectId,
    },
  });

  if (standaloneVideo) {
    console.log(`✅ Found StandaloneVideo ${standaloneVideo.id}`);
    console.log(`   - Title: "${standaloneVideo.title || 'Untitled'}"`);

    console.log(`\n💾 Marking video as FAILED in database...`);

    // Update StandaloneVideo to FAILED status
    await prisma.standaloneVideo.update({
      where: { id: standaloneVideo.id },
      data: {
        status: 'FAILED',
        error: `Submagic editing failed: ${errorMessage || 'Unknown error'}`,
      },
    });

    console.log(`✅ StandaloneVideo marked as FAILED`);
    console.error(`\n⚠️  FAILURE HANDLED: Video marked as failed`);
    console.error('==========================================\n');
    return;
  }

  // Neither found
  console.error(`❌ CRITICAL: No VideoOutput or StandaloneVideo found for Submagic project ${projectId}`);
  console.error(`   Cannot mark video as failed - no matching record in database`);
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
