import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/database';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { profileService } from '@/lib/services/profile.service';
import { queueService } from '@/lib/services/core/queue.service';
import { getOrgFromSlug, validateOrgAccess } from '@/lib/context/org-context';

// Validation schema
const CreateArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  content: z.string().min(1, 'Content is required'),
  category: z.enum(['EVERGREEN', 'PERIODIC_UPDATES', 'MARKET_UPDATES']).optional(),
});

/**
 * GET /api/org/[orgSlug]/articles - Get all articles for organization
 */
export async function GET(
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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const category = searchParams.get('category');

    // Build where clause - ALWAYS filter by organizationId
    const where: any = {
      organizationId: org.id,
    };
    if (category) {
      where.category = category.toUpperCase();
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          submissions: {
            select: {
              id: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get Articles Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch articles',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/org/[orgSlug]/articles - Create new article (manual entry)
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
        {
          success: false,
          error: 'Unauthorized',
        },
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

    // Upsert profile to ensure it exists
    await profileService.upsertProfile(user);

    const body = await request.json();
    const validatedData = CreateArticleSchema.parse(body);

    const article = await prisma.article.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        category: validatedData.category as any || 'EVERGREEN',
        userId: user.id,
        organizationId: org.id, // Always set organizationId
      },
    });

    // Enqueue thumbnail generation job (background processing)
    console.log('==========================================');
    console.log('🚀 ARTICLE THUMBNAIL JOB - STARTING ENQUEUE');
    console.log(`Article ID: ${article.id}`);
    console.log(`Article Title: ${article.title}`);
    console.log(`Organization ID: ${org.id}`);
    console.log('==========================================');

    try {
      const job = await queueService.addArticleThumbnailGenerationJob({
        articleId: article.id,
        title: article.title,
        organizationId: org.id,
      });
      console.log('✅ ARTICLE THUMBNAIL JOB - ENQUEUED SUCCESSFULLY');
      console.log(`Job ID: ${job.id}`);
      console.log(`Job Name: ${job.name}`);
      console.log(`Job Data:`, job.data);
      console.log('==========================================');
    } catch (error) {
      console.error('❌ ARTICLE THUMBNAIL JOB - ENQUEUE FAILED');
      console.error(`Error:`, error);
      console.error('==========================================');
      // Continue without thumbnail job - not critical
    }

    return NextResponse.json(
      {
        success: true,
        data: article,
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

    console.error('Create Article Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create article',
      },
      { status: 500 }
    );
  }
}
