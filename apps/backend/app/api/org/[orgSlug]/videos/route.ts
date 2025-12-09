import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/database';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess } from '@/lib/context/org-context';

/**
 * GET /api/org/[orgSlug]/videos - Get all standalone videos for organization
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string }> }
) {
  const params = await props.params;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const hasAccess = await validateOrgAccess(user.id, params.orgSlug);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this organization' },
        { status: 403 }
      );
    }

    const org = await getOrgFromSlug(params.orgSlug);
    if (!org) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    const videos = await prisma.standaloneVideo.findMany({
      where: {
        organizationId: org.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        videos,
        total: videos.length,
      },
    });
  } catch (error) {
    console.error('Get Standalone Videos Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
