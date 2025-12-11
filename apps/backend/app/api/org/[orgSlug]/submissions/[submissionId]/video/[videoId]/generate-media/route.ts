import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess, validateResourceOrg } from '@/lib/context/org-context';
import { queueService } from '@/lib/services/core/queue.service';
import { prisma } from '@/lib/config/database';
import { z } from 'zod';

const VideoCustomizationSchema = z.object({
  characterId: z.string(), // Our DB Character ID - heygenImageKey and voiceId are looked up from Character
  captionStyleId: z.string(), // Our DB CaptionStyle ID - submagicTemplate is looked up from CaptionStyle
  enableMagicZooms: z.boolean().optional().default(true),
  enableMagicBrolls: z.boolean().optional().default(true),
  magicBrollsPercentage: z.number().min(0).max(100).optional().default(40),
  generateBubbles: z.boolean().optional().default(true),
  // Background Music
  backgroundMusicId: z.string().nullable().optional(),
  backgroundMusicVolume: z.number().min(0).max(1).optional(),
  // Bumpers
  startBumperId: z.string().nullable().optional(),
  startBumperDuration: z.number().min(1).max(10).nullable().optional(),
  endBumperId: z.string().nullable().optional(),
  endBumperDuration: z.number().min(1).max(10).nullable().optional(),
});

/**
 * POST /api/org/[orgSlug]/submissions/[submissionId]/video/[videoId]/generate-media
 * Trigger video generation from approved script
 *
 * Body: { videoCustomization: VideoCustomizationConfig }
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string; submissionId: string; videoId: string }> }
) {
  const params = await props.params;
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Validate user has access to this organization
    const hasAccess = await validateOrgAccess(user.id, params.orgSlug);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this organization' },
        { status: 403 }
      );
    }

    // Get organization
    const org = await getOrgFromSlug(params.orgSlug);
    if (!org) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    // Verify submission belongs to this organization
    const belongsToOrg = await validateResourceOrg('submission', params.submissionId, org.id);
    if (!belongsToOrg) {
      return NextResponse.json(
        { success: false, error: 'Submission not found in this organization' },
        { status: 404 }
      );
    }

    // Get video output and verify status
    const videoOutput = await prisma.videoOutput.findUnique({
      where: { id: params.videoId },
      include: { submission: true },
    });

    if (!videoOutput) {
      return NextResponse.json({ success: false, error: 'Video not found' }, { status: 404 });
    }

    if (videoOutput.submissionId !== params.submissionId) {
      return NextResponse.json(
        { success: false, error: 'Video does not belong to this submission' },
        { status: 400 }
      );
    }

    // Verify video is in SCRIPT_READY status
    if (videoOutput.status !== 'SCRIPT_READY') {
      return NextResponse.json(
        {
          success: false,
          error: `Video must be in SCRIPT_READY status to generate media. Current status: ${videoOutput.status}`,
        },
        { status: 400 }
      );
    }

    // Verify script exists
    if (!videoOutput.script) {
      return NextResponse.json(
        { success: false, error: 'No script available for video generation' },
        { status: 400 }
      );
    }

    // Parse and validate video customization from request body
    const body = await request.json();
    const validationResult = VideoCustomizationSchema.safeParse(body.videoCustomization);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid video customization',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const videoCustomization = validationResult.data;

    // Validate character belongs to this organization and has required fields
    const character = await prisma.character.findFirst({
      where: {
        id: videoCustomization.characterId,
        organizationId: org.id,
      },
    });

    if (!character) {
      return NextResponse.json(
        { success: false, error: 'Character not found in this organization' },
        { status: 404 }
      );
    }

    if (!character.heygenImageKey) {
      return NextResponse.json(
        { success: false, error: 'Character does not have HeyGen image key configured' },
        { status: 400 }
      );
    }

    // Validate caption style belongs to this organization
    const captionStyle = await prisma.captionStyle.findFirst({
      where: {
        id: videoCustomization.captionStyleId,
        organizationId: org.id,
      },
    });

    if (!captionStyle) {
      return NextResponse.json(
        { success: false, error: 'Caption style not found in this organization' },
        { status: 404 }
      );
    }

    // Validate background music belongs to organization (if provided)
    if (videoCustomization.backgroundMusicId) {
      const music = await prisma.backgroundMusic.findFirst({
        where: { id: videoCustomization.backgroundMusicId, organizationId: org.id },
      });
      if (!music) {
        return NextResponse.json({ success: false, error: 'Background music not found' }, { status: 404 });
      }
    }

    // Validate start bumper belongs to organization (if provided)
    if (videoCustomization.startBumperId) {
      const bumper = await prisma.videoBumper.findFirst({
        where: { id: videoCustomization.startBumperId, organizationId: org.id },
      });
      if (!bumper) {
        return NextResponse.json({ success: false, error: 'Start bumper not found' }, { status: 404 });
      }
    }

    // Validate end bumper belongs to organization (if provided)
    if (videoCustomization.endBumperId) {
      const bumper = await prisma.videoBumper.findFirst({
        where: { id: videoCustomization.endBumperId, organizationId: org.id },
      });
      if (!bumper) {
        return NextResponse.json({ success: false, error: 'End bumper not found' }, { status: 404 });
      }
    }

    // Update VideoOutput with customization settings and set status to PROCESSING
    await prisma.videoOutput.update({
      where: { id: params.videoId },
      data: {
        status: 'PROCESSING',
        characterId: videoCustomization.characterId, // Store internal Character ID
        enableCaptions: true, // Always enabled
        submagicTemplate: captionStyle.submagicTemplate, // Use caption style's template
        enableMagicZooms: videoCustomization.enableMagicZooms,
        enableMagicBrolls: videoCustomization.enableMagicBrolls,
        magicBrollsPercentage: videoCustomization.magicBrollsPercentage,
        generateBubbles: videoCustomization.generateBubbles,
        // Music & Bumpers
        backgroundMusicId: videoCustomization.backgroundMusicId || null,
        backgroundMusicVolume: videoCustomization.backgroundMusicVolume ?? 0.15,
        startBumperId: videoCustomization.startBumperId || null,
        startBumperDuration: videoCustomization.startBumperDuration || null,
        endBumperId: videoCustomization.endBumperId || null,
        endBumperDuration: videoCustomization.endBumperDuration || null,
        error: null,
      },
    });

    // Queue the video generation job
    await queueService.addVideoMediaGenerationJob({
      videoOutputId: params.videoId,
      submissionId: params.submissionId,
      organizationId: org.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Video generation started',
      data: {
        videoId: params.videoId,
        status: 'PROCESSING',
      },
    });
  } catch (error) {
    console.error('Generate Video Media Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start video generation',
      },
      { status: 500 }
    );
  }
}
