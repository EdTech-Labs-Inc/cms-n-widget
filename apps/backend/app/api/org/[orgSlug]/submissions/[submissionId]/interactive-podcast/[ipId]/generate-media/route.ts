import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess, validateResourceOrg } from '@/lib/context/org-context';
import { queueService } from '@/lib/services/core/queue.service';
import { prisma } from '@/lib/config/database';
import { z } from 'zod';

const VoiceSelectionSchema = z
  .object({
    voiceId: z.string().optional(),
  })
  .optional();

/**
 * POST /api/org/[orgSlug]/submissions/[submissionId]/interactive-podcast/[ipId]/generate-media
 * Trigger interactive podcast audio generation from approved script
 *
 * Body: { voiceSelection?: { voiceId?: string } }
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string; submissionId: string; ipId: string }> }
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

    // Get interactive podcast output and verify status
    const ipOutput = await prisma.interactivePodcastOutput.findUnique({
      where: { id: params.ipId },
      include: { submission: true },
    });

    if (!ipOutput) {
      return NextResponse.json(
        { success: false, error: 'Interactive podcast not found' },
        { status: 404 }
      );
    }

    if (ipOutput.submissionId !== params.submissionId) {
      return NextResponse.json(
        { success: false, error: 'Interactive podcast does not belong to this submission' },
        { status: 400 }
      );
    }

    // Verify interactive podcast is in SCRIPT_READY status
    if (ipOutput.status !== 'SCRIPT_READY') {
      return NextResponse.json(
        {
          success: false,
          error: `Interactive podcast must be in SCRIPT_READY status to generate media. Current status: ${ipOutput.status}`,
        },
        { status: 400 }
      );
    }

    // Verify script exists (stored in segments field)
    const segments = ipOutput.segments as any;
    const hasScript = segments?.script || (Array.isArray(segments) && segments.length > 0);
    if (!hasScript) {
      return NextResponse.json(
        { success: false, error: 'No script available for interactive podcast generation' },
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

    // Validate voice belongs to this organization (if provided)
    if (voiceSelection?.voiceId) {
      const validVoice = await prisma.voice.findFirst({
        where: {
          organizationId: org.id,
          elevenlabsVoiceId: voiceSelection.voiceId,
        },
      });

      if (!validVoice) {
        return NextResponse.json(
          { success: false, error: 'Invalid voice for this organization' },
          { status: 400 }
        );
      }
    }

    // Update InteractivePodcastOutput status to PROCESSING
    await prisma.interactivePodcastOutput.update({
      where: { id: params.ipId },
      data: {
        status: 'PROCESSING',
        error: null,
      },
    });

    // Queue the interactive podcast generation job
    await queueService.addInteractivePodcastMediaGenerationJob({
      interactivePodcastOutputId: params.ipId,
      submissionId: params.submissionId,
      organizationId: org.id,
      voiceSelection,
    });

    return NextResponse.json({
      success: true,
      message: 'Interactive podcast generation started',
      data: {
        interactivePodcastId: params.ipId,
        status: 'PROCESSING',
      },
    });
  } catch (error) {
    console.error('Generate Interactive Podcast Media Error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to start interactive podcast generation',
      },
      { status: 500 }
    );
  }
}
