import { NextRequest, NextResponse } from 'next/server';
import { tagService } from '@/lib/services/tag.service';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess, validateResourceOrg } from '@/lib/context/org-context';

const UpdateTagSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
});

/**
 * GET /api/org/[orgSlug]/tags/:id - Get single tag by ID
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string; id: string }> }
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

    // Verify tag belongs to this organization
    const belongsToOrg = await validateResourceOrg('tag', params.id, org.id);
    if (!belongsToOrg) {
      return NextResponse.json(
        { success: false, error: 'Tag not found in this organization' },
        { status: 404 }
      );
    }

    const tag = await tagService.getTagById(params.id);

    if (!tag) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tag not found',
        },
        { status: 404 }
      );
    }

    // Get usage stats
    const stats = await tagService.getTagStats(params.id);

    return NextResponse.json({
      success: true,
      data: {
        ...tag,
        stats,
      },
    });
  } catch (error) {
    console.error('Get Tag Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tag',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/org/[orgSlug]/tags/:id - Update a tag
 */
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string; id: string }> }
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

    // Verify tag belongs to this organization
    const belongsToOrg = await validateResourceOrg('tag', params.id, org.id);
    if (!belongsToOrg) {
      return NextResponse.json(
        { success: false, error: 'Tag not found in this organization' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = UpdateTagSchema.parse(body);

    const tag = await tagService.updateTag(params.id, org.id, validatedData);

    return NextResponse.json({
      success: true,
      data: tag,
      message: 'Tag updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Update Tag Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update tag',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/org/[orgSlug]/tags/:id - Delete a tag
 */
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string; id: string }> }
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

    // Verify tag belongs to this organization
    const belongsToOrg = await validateResourceOrg('tag', params.id, org.id);
    if (!belongsToOrg) {
      return NextResponse.json(
        { success: false, error: 'Tag not found in this organization' },
        { status: 404 }
      );
    }

    await tagService.deleteTag(params.id);

    return NextResponse.json({
      success: true,
      message: 'Tag deleted successfully',
    });
  } catch (error) {
    console.error('Delete Tag Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete tag',
      },
      { status: 500 }
    );
  }
}
