import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/config/database';
import { storageService } from '@/lib/services/core/storage.service';
import { getOrgFromSlug, validateOrgAccess, validateResourceOrg } from '@/lib/context/org-context';

// Configure route to handle file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

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
      select: { id: true, title: true },
    });

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPG and PNG are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload custom thumbnail
    const thumbnailUrl = await storageService.uploadCustomThumbnail(
      buffer,
      'article',
      article.id,
      file.type as 'image/jpeg' | 'image/png'
    );

    // Update article with new thumbnail URL
    const updatedArticle = await prisma.article.update({
      where: { id: params.id },
      data: { thumbnailUrl },
    });

    return NextResponse.json({
      success: true,
      data: { thumbnailUrl: updatedArticle.thumbnailUrl },
      message: 'Thumbnail uploaded successfully',
    });
  } catch (error) {
    console.error('Upload Article Thumbnail Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload thumbnail',
      },
      { status: 500 }
    );
  }
}
