import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess, validateResourceOrg } from '@/lib/context/org-context';
import { queueService } from '@/lib/services/core/queue.service';
import { prisma } from '@/lib/config/database';
import { z } from 'zod';

const VoiceSelectionSchema = z
  .object({
    interviewerVoiceId: z.string().optional(),
    guestVoiceId: z.string().optional(),
  })
  .optional();

/**
 * POST /api/org/[orgSlug]/submissions/[submissionId]/podcast/[podcastId]/generate-media
 * Trigger podcast audio generation from approved transcript
 *
 * Body: { voiceSelection?: { interviewerVoiceId?: string, guestVoiceId?: string } }
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string; submissionId: string; podcastId: string }> }
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

    // Get podcast output and verify status
    const podcastOutput = await prisma.podcastOutput.findUnique({
      where: { id: params.podcastId },
      include: { submission: true },
    });

    if (!podcastOutput) {
      return NextResponse.json({ success: false, error: 'Podcast not found' }, { status: 404 });
    }

    if (podcastOutput.submissionId !== params.submissionId) {
      return NextResponse.json(
        { success: false, error: 'Podcast does not belong to this submission' },
        { status: 400 }
      );
    }

    // Verify podcast is in SCRIPT_READY status
    if (podcastOutput.status !== 'SCRIPT_READY') {
      return NextResponse.json(
        {
          success: false,
          error: `Podcast must be in SCRIPT_READY status to generate media. Current status: ${podcastOutput.status}`,
        },
        { status: 400 }
      );
    }

    // Verify transcript exists
    if (!podcastOutput.transcript) {
      return NextResponse.json(
        { success: false, error: 'No transcript available for podcast generation' },
        { status: 400 }
      );
    }

    // Parse optional voice selection from request body
    const body = await request.json().catch(() => ({}));
    const validationResult = VoiceSelectionSchema.safeParse(body.voiceSelection);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid voice selection',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const voiceSelection = validationResult.data;

    // Update PodcastOutput status to PROCESSING
    await prisma.podcastOutput.update({
      where: { id: params.podcastId },
      data: {
        status: 'PROCESSING',
        error: null,
      },
    });

    // Queue the podcast generation job
    await queueService.addPodcastMediaGenerationJob({
      podcastOutputId: params.podcastId,
      submissionId: params.submissionId,
      organizationId: org.id,
      voiceSelection,
    });

    return NextResponse.json({
      success: true,
      message: 'Podcast generation started',
      data: {
        podcastId: params.podcastId,
        status: 'PROCESSING',
      },
    });
  } catch (error) {
    console.error('Generate Podcast Media Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start podcast generation',
      },
      { status: 500 }
    );
  }
}
