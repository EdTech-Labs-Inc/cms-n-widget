import { NextRequest, NextResponse } from 'next/server';
import { tagService } from '@/lib/services/tag.service';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess } from '@/lib/context/org-context';

const CreateTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  category: z.string().optional(),
});

const BulkCreateTagsSchema = z.object({
  tags: z.array(CreateTagSchema),
});

/**
 * POST /api/org/[orgSlug]/tags/bulk - Bulk create tags
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string }> }
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

    const body = await request.json();
    const validatedData = BulkCreateTagsSchema.parse(body);

    const result = await tagService.bulkCreateTags(org.id, validatedData.tags);

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: `Created ${result.created.length} tags, skipped ${result.skipped.length}, ${result.errors.length} errors`,
      },
      { status: 201 }
    );
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

    console.error('Bulk Create Tags Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create tags',
      },
      { status: 500 }
    );
  }
}
