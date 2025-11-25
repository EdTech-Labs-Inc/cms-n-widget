import { NextRequest, NextResponse } from 'next/server';
import { SubmissionsController } from '@/lib/controllers/submissions.controller';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess, validateResourceOrg } from '@/lib/context/org-context';

/**
 * GET /api/org/[orgSlug]/submissions/[submissionId]/interactive-podcast/[ipId]/tags
 * Get all tags for an interactive podcast output
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string; submissionId: string; ipId: string }> }
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

    // Get interactive podcast tags
    const tags = await SubmissionsController.getInteractivePodcastTags(params.ipId);

    return NextResponse.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error('Get Interactive Podcast Tags Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get interactive podcast tags',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/org/[orgSlug]/submissions/[submissionId]/interactive-podcast/[ipId]/tags
 * Add a tag to an interactive podcast output
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string; submissionId: string; ipId: string }> }
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

    // Add tag to interactive podcast output
    const result = await SubmissionsController.addInteractivePodcastTag(params.submissionId, params.ipId, tagId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Add Interactive Podcast Tag Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add tag to interactive podcast',
      },
      { status: 500 }
    );
  }
}
