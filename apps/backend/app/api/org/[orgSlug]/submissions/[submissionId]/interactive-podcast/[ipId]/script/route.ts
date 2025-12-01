import { NextRequest, NextResponse } from 'next/server';
import { SubmissionsController } from '@/lib/controllers/submissions.controller';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess, validateResourceOrg } from '@/lib/context/org-context';

/**
 * GET /api/org/[orgSlug]/submissions/[submissionId]/interactive-podcast/[ipId]/script
 * Get the script for an interactive podcast output
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

    // Get interactive podcast script
    const script = await SubmissionsController.getInteractivePodcastScript(params.ipId);

    return NextResponse.json({
      success: true,
      data: script,
    });
  } catch (error) {
    console.error('Get Interactive Podcast Script Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get interactive podcast script',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/org/[orgSlug]/submissions/[submissionId]/interactive-podcast/[ipId]/script
 * Update the script for an interactive podcast output
 */
export async function PATCH(
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
    const { script } = body;

    if (typeof script !== 'string') {
      return NextResponse.json(
        { success: false, error: 'script field is required and must be a string' },
        { status: 400 }
      );
    }

    // Update interactive podcast script
    const result = await SubmissionsController.updateInteractivePodcastScript(
      params.submissionId,
      params.ipId,
      script
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Update Interactive Podcast Script Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update interactive podcast script',
      },
      { status: 500 }
    );
  }
}
