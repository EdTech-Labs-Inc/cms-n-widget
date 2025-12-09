import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/database';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess } from '@/lib/context/org-context';

/**
 * GET /api/org/[orgSlug]/videos/[videoId]/download - Download a video file
 * Proxies the CloudFront URL with proper Content-Disposition header
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string; videoId: string }> }
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

    const video = await prisma.standaloneVideo.findFirst({
      where: {
        id: params.videoId,
        organizationId: org.id,
      },
    });

    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      );
    }

    if (!video.videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Video file not available' },
        { status: 404 }
      );
    }

    // Fetch the video from CloudFront
    const videoResponse = await fetch(video.videoUrl);
    if (!videoResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch video file' },
        { status: 502 }
      );
    }

    const videoBlob = await videoResponse.blob();
    const filename = `${video.title || 'video'}.mp4`.replace(/[^a-zA-Z0-9.-]/g, '_');

    return new NextResponse(videoBlob, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': videoBlob.size.toString(),
      },
    });
  } catch (error) {
    console.error('Download Video Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download video' },
      { status: 500 }
    );
  }
}
