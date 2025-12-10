import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/database';
import { submagicService } from '@/lib/services/external/submagic.service';
import { z } from 'zod';

/**
 * Test endpoint for Submagic integration (DEV ONLY)
 *
 * Creates a StandaloneVideo record and triggers Submagic directly,
 * bypassing the full HeyGen flow. The webhook will work normally
 * since we create a real DB record.
 */

const TestSubmagicSchema = z.object({
  videoUrl: z.string().url(),
  organizationId: z.string().uuid(),
  title: z.string().optional().default('Test Video'),
  userThemeId: z.string().optional().default('9a3c5f9f-a496-41d0-a104-b1e6dad84d89'),
  language: z.string().optional().default('ENGLISH'),
  enableMagicZooms: z.boolean().optional().default(true),
  enableMagicBrolls: z.boolean().optional().default(true),
  magicBrollsPercentage: z.number().min(0).max(100).optional().default(40),
  captionStyleId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  // DEV ONLY - return 404 in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  console.log('==========================================');
  console.log('🧪 TEST SUBMAGIC ENDPOINT');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('==========================================');

  try {
    const body = await request.json();
    console.log('📦 Request body:', JSON.stringify(body, null, 2));

    // Validate request
    const validationResult = TestSubmagicSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('❌ Validation failed:', validationResult.error.errors);
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const {
      videoUrl,
      organizationId,
      title,
      userThemeId,
      language,
      enableMagicZooms,
      enableMagicBrolls,
      magicBrollsPercentage,
      captionStyleId,
    } = validationResult.data;

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      console.error(`❌ Organization not found: ${organizationId}`);
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Organization found: ${organization.name}`);

    // Create a StandaloneVideo record for tracking
    console.log('\n📝 Creating StandaloneVideo record...');
    const standaloneVideo = await prisma.standaloneVideo.create({
      data: {
        organizationId,
        title,
        script: '[TEST] This is a test video for Submagic integration',
        sourceType: 'test',
        // Use placeholder values for character/voice since we're bypassing HeyGen
        characterId: 'test-character',
        heygenAvatarId: 'test-avatar',
        heygenCharacterType: 'avatar',
        voiceId: 'test-voice',
        // Submagic config
        captionStyleId,
        enableMagicZooms,
        enableMagicBrolls,
        magicBrollsPercentage,
        // Mark as processing (we're skipping HeyGen)
        status: 'PROCESSING',
      },
      include: {
        captionStyle: true,
      },
    });

    console.log(`✅ StandaloneVideo created: ${standaloneVideo.id}`);

    // Log the caption template configuration
    console.log(`\n📝 CAPTION TEMPLATE CONFIG (Test):`);
    console.log(`   - Caption Style ID: ${captionStyleId || 'none'}`);
    console.log(`   - Caption Style Name: ${standaloneVideo.captionStyle?.name || 'none'}`);
    console.log(`   - User Theme ID: ${userThemeId}`);
    console.log(`   - Language: ${language}`);
    console.log(`   - Enable Captions: true`);
    console.log(`   - Magic Zooms: ${enableMagicZooms}`);
    console.log(`   - Magic B-Rolls: ${enableMagicBrolls} (${magicBrollsPercentage}%)`);

    // Construct webhook URL
    const webhookUrl = `${process.env.SUBMAGIC_WEBHOOK_URL}/api/webhooks/submagic`;
    console.log(`\n🔔 Submagic webhook URL: ${webhookUrl}`);

    // Call Submagic
    console.log(`\n📤 Uploading video to Submagic...`);
    console.log(`   - Video URL: ${videoUrl}`);

    const { projectId } = await submagicService.uploadVideoForEditing(
      videoUrl,
      webhookUrl,
      title,
      language,
      {
        userThemeId,
        enableCaptions: true,
        magicZooms: enableMagicZooms,
        magicBrolls: enableMagicBrolls,
        magicBrollsPercentage,
      }
    );

    console.log(`✅ Submagic project created: ${projectId}`);

    // Update the record with Submagic project ID
    await prisma.standaloneVideo.update({
      where: { id: standaloneVideo.id },
      data: { submagicProjectId: projectId },
    });

    console.log(`✅ StandaloneVideo updated with submagicProjectId`);
    console.log(`\n🎯 SUCCESS: Test video submitted to Submagic`);
    console.log(`   - StandaloneVideo ID: ${standaloneVideo.id}`);
    console.log(`   - Submagic Project ID: ${projectId}`);
    console.log(`   - Awaiting Submagic webhook callback...`);
    console.log('==========================================\n');

    return NextResponse.json({
      success: true,
      standaloneVideoId: standaloneVideo.id,
      submagicProjectId: projectId,
      message: 'Video submitted to Submagic. Check logs for webhook callback.',
    });
  } catch (error) {
    console.error('==========================================');
    console.error('❌ TEST SUBMAGIC ERROR');
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    if (error instanceof Error && error.stack) {
      console.error(`Stack trace:\n${error.stack}`);
    }
    console.error('==========================================\n');

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Test failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/test/submagic - Get status of a test video
 */
export async function GET(request: NextRequest) {
  // DEV ONLY
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const standaloneVideoId = searchParams.get('id');
  const submagicProjectId = searchParams.get('projectId');

  if (!standaloneVideoId && !submagicProjectId) {
    return NextResponse.json(
      { error: 'Provide either id or projectId query parameter' },
      { status: 400 }
    );
  }

  try {
    const standaloneVideo = await prisma.standaloneVideo.findFirst({
      where: standaloneVideoId
        ? { id: standaloneVideoId }
        : { submagicProjectId: submagicProjectId! },
      include: {
        captionStyle: true,
      },
    });

    if (!standaloneVideo) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: standaloneVideo.id,
      status: standaloneVideo.status,
      submagicProjectId: standaloneVideo.submagicProjectId,
      videoUrl: standaloneVideo.videoUrl,
      error: standaloneVideo.error,
      captionStyle: standaloneVideo.captionStyle?.name,
      captionTemplate: standaloneVideo.captionStyle?.submagicTemplate,
      enableMagicZooms: standaloneVideo.enableMagicZooms,
      enableMagicBrolls: standaloneVideo.enableMagicBrolls,
      magicBrollsPercentage: standaloneVideo.magicBrollsPercentage,
      createdAt: standaloneVideo.createdAt,
      updatedAt: standaloneVideo.updatedAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get status' },
      { status: 500 }
    );
  }
}
