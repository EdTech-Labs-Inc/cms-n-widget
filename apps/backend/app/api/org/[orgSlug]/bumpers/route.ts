import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/database';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess } from '@/lib/context/org-context';
import { z } from 'zod';

const CreateBumperSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['image', 'video'], { errorMap: () => ({ message: 'Type must be image or video' }) }),
  position: z.enum(['start', 'end', 'both'], { errorMap: () => ({ message: 'Position must be start, end, or both' }) }),
  mediaUrl: z.string().url('Media URL must be valid'),
  thumbnailUrl: z.string().url('Thumbnail URL must be valid').optional(),
  duration: z.number().int().positive().optional(),
});

/**
 * GET /api/org/[orgSlug]/bumpers - Get all video bumpers for organization
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

    // Optional query param to filter by position
    const url = new URL(request.url);
    const position = url.searchParams.get('position');

    const whereClause: { organizationId: string; position?: string } = {
      organizationId: org.id,
    };

    if (position && ['start', 'end', 'both'].includes(position)) {
      whereClause.position = position;
    }

    const bumpers = await prisma.videoBumper.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        bumpers,
        total: bumpers.length,
      },
    });
  } catch (error) {
    console.error('Get Bumpers Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bumpers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/org/[orgSlug]/bumpers - Create new video bumper
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
    const validationResult = CreateBumperSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const bumper = await prisma.videoBumper.create({
      data: {
        ...validationResult.data,
        organizationId: org.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: bumper,
    }, { status: 201 });
  } catch (error) {
    console.error('Create Bumper Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create bumper' },
      { status: 500 }
    );
  }
}
