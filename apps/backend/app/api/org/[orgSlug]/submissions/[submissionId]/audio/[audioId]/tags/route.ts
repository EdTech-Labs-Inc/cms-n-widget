import { NextRequest, NextResponse } from 'next/server';
import { SubmissionsController } from '@/lib/controllers/submissions.controller';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess, validateResourceOrg } from '@/lib/context/org-context';

/**
 * GET /api/org/[orgSlug]/submissions/[submissionId]/audio/[audioId]/tags
 * Get all tags for an audio output
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string; submissionId: string; audioId: string }> }
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

    // Get audio tags
    const tags = await SubmissionsController.getAudioTags(params.audioId);

    return NextResponse.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error('Get Audio Tags Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get audio tags',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/org/[orgSlug]/submissions/[submissionId]/audio/[audioId]/tags
 * Add a tag to an audio output
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string; submissionId: string; audioId: string }> }
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
    const { tagId } = body;

    if (!tagId) {
      return NextResponse.json(
        { success: false, error: 'tagId is required' },
        { status: 400 }
      );
    }

    // Validate tag belongs to organization
    const tagBelongsToOrg = await validateResourceOrg('tag', tagId, org.id);
    if (!tagBelongsToOrg) {
      return NextResponse.json(
        { success: false, error: 'Tag not found in this organization' },
        { status: 404 }
      );
    }

    // Add tag to audio output
    const result = await SubmissionsController.addAudioTag(params.submissionId, params.audioId, tagId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Add Audio Tag Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add tag to audio',
      },
      { status: 500 }
    );
  }
}
