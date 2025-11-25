import { NextRequest, NextResponse } from 'next/server';
import { SubmissionsController } from '@/lib/controllers/submissions.controller';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess, validateResourceOrg } from '@/lib/context/org-context';

/**
 * POST /api/org/[orgSlug]/submissions/[submissionId]/podcast/[podcastId]/regenerate-thumbnail
 * Regenerate the thumbnail for a podcast output with custom prompt
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string; submissionId: string; podcastId: string }> }
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

    // Parse request body
    const body = await request.json();
    const { customPrompt } = body;

    if (!customPrompt || typeof customPrompt !== 'string' || customPrompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'customPrompt is required' },
        { status: 400 }
      );
    }

    // Regenerate podcast thumbnail with custom prompt
    const result = await SubmissionsController.regeneratePodcastThumbnail(
      params.submissionId,
      params.podcastId,
      customPrompt.trim()
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Regenerate Podcast Thumbnail Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to regenerate podcast thumbnail',
      },
      { status: 500 }
    );
  }
}
