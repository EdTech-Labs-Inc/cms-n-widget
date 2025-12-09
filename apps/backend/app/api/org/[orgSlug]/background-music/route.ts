import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/database';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess } from '@/lib/context/org-context';
import { z } from 'zod';

const CreateBackgroundMusicSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  previewAudioUrl: z.string().url('Preview audio URL must be valid'),
  audioUrl: z.string().url('Audio URL must be valid'),
  duration: z.number().int().positive().optional(),
});

/**
 * GET /api/org/[orgSlug]/background-music - Get all background music for organization
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

    const backgroundMusic = await prisma.backgroundMusic.findMany({
      where: {
        organizationId: org.id,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        backgroundMusic,
        total: backgroundMusic.length,
      },
    });
  } catch (error) {
    console.error('Get Background Music Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch background music' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/org/[orgSlug]/background-music - Create new background music
 */
export async function POST(
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

    const body = await request.json();
    const validationResult = CreateBackgroundMusicSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const backgroundMusic = await prisma.backgroundMusic.create({
      data: {
        ...validationResult.data,
        organizationId: org.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: backgroundMusic,
    }, { status: 201 });
  } catch (error) {
    console.error('Create Background Music Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create background music' },
      { status: 500 }
    );
  }
}
