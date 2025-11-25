import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/config/database';
import { thumbnailService } from '@/lib/services/media/thumbnail.service';
import { getOrgFromSlug, validateOrgAccess, validateResourceOrg } from '@/lib/context/org-context';

export async function POST(
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

    // Verify article belongs to this organization
    const belongsToOrg = await validateResourceOrg('article', params.id, org.id);
    if (!belongsToOrg) {
      return NextResponse.json(
        { success: false, error: 'Article not found in this organization' },
        { status: 404 }
      );
    }

    // Get the article
    const article = await prisma.article.findUnique({
      where: { id: params.id },
      select: { id: true, title: true, thumbnailUrl: true },
    });

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Regenerate thumbnail with custom prompt
    const newThumbnailUrl = await thumbnailService.regenerateThumbnailWithPrompt(
      article.title,
      'article',
      article.id,
      prompt.trim(),
      article.thumbnailUrl || undefined
    );

    // Update article with new thumbnail URL
    const updatedArticle = await prisma.article.update({
      where: { id: params.id },
      data: { thumbnailUrl: newThumbnailUrl },
    });

    return NextResponse.json({
      success: true,
      data: { thumbnailUrl: updatedArticle.thumbnailUrl },
      message: 'Thumbnail regenerated successfully',
    });
  } catch (error) {
    console.error('Regenerate Article Thumbnail Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to regenerate thumbnail',
      },
      { status: 500 }
    );
  }
}
