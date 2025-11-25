import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/database';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess, validateResourceOrg } from '@/lib/context/org-context';

const CreateArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  content: z.string().min(1, 'Content is required'),
  category: z.enum(['EVERGREEN', 'PERIODIC_UPDATES', 'MARKET_UPDATES']).optional(),
});

/**
 * GET /api/org/[orgSlug]/articles/:id - Get single article by ID
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string; id: string }> }
) {
  const params = await props.params;
  console.log('🔵 [GET /api/org/[orgSlug]/articles/[id]] Request received');
  console.log('🔵 [API] Params:', params);
  console.log('🔵 [API] Request URL:', request.url);
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔐 [API] User:', user?.id);

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

    console.log('📄 [API] Fetching article with ID:', params.id, 'for org:', org.id);
    const article = await prisma.article.findFirst({
      where: {
        id: params.id,
        organizationId: org.id, // Ensure article belongs to this org
      },
      include: {
        submissions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    console.log('📄 [API] Article found:', !!article);
    if (article) {
      console.log('📄 [API] Article details:', { id: article.id, title: article.title, orgId: article.organizationId });
    }

    if (!article) {
      console.error('❌ [API] Article not found');
      return NextResponse.json(
        {
          success: false,
          error: 'Article not found',
        },
        { status: 404 }
      );
    }

    console.log('✅ [API] Returning article');
    return NextResponse.json({
      success: true,
      data: article,
    });
  } catch (error) {
    console.error('Get Article Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch article',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/org/[orgSlug]/articles/:id - Update an article
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

    // Verify article belongs to this organization
    const belongsToOrg = await validateResourceOrg('article', params.id, org.id);
    if (!belongsToOrg) {
      return NextResponse.json(
        { success: false, error: 'Article not found in this organization' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updateData = CreateArticleSchema.partial().parse(body);

    const article = await prisma.article.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: article,
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

    console.error('Update Article Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update article',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/org/[orgSlug]/articles/:id - Delete an article
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

    // Verify article belongs to this organization
    const belongsToOrg = await validateResourceOrg('article', params.id, org.id);
    if (!belongsToOrg) {
      return NextResponse.json(
        { success: false, error: 'Article not found in this organization' },
        { status: 404 }
      );
    }

    await prisma.article.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Article deleted successfully',
    });
  } catch (error) {
    console.error('Delete Article Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete article',
      },
      { status: 500 }
    );
  }
}
