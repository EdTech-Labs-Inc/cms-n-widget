import { NextRequest, NextResponse } from 'next/server';
import { SubmissionsController } from '@/lib/controllers/submissions.controller';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess, validateResourceOrg } from '@/lib/context/org-context';

/**
 * DELETE /api/org/[orgSlug]/submissions/[submissionId]/audio/[audioId]/tags/[tagId]
 * Remove a tag from an audio output
 */
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string; submissionId: string; audioId: string; tagId: string }> }
) {
  const params = await props.params;
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
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
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Verify submission belongs to this organization
    const belongsToOrg = await validateResourceOrg('submission', params.submissionId, org.id);
    if (!belongsToOrg) {
      return NextResponse.json(
        { success: false, error: 'Submission not found in this organization' },
        { status: 404 }
      );
    }

    // Remove tag from audio output
    await SubmissionsController.removeAudioTag(params.audioId, params.tagId);

    return NextResponse.json({
      success: true,
      message: 'Tag removed from audio output',
    });
  } catch (error) {
    console.error('Remove Audio Tag Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove tag from audio',
      },
      { status: 500 }
    );
  }
}
