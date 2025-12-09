import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/database';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess } from '@/lib/context/org-context';
import { z } from 'zod';

const CreateCaptionStyleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  submagicTemplate: z.string().min(1, 'Submagic template is required'),
  previewImageUrl: z.string().url('Preview image URL must be valid').optional(),
  logoUrl: z.string().url('Logo URL must be valid').optional(),
  logoPosition: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']).optional(),
});

/**
 * GET /api/org/[orgSlug]/caption-styles - Get all caption styles for organization
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

    const captionStyles = await prisma.captionStyle.findMany({
      where: {
        organizationId: org.id,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        captionStyles,
        total: captionStyles.length,
      },
    });
  } catch (error) {
    console.error('Get Caption Styles Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch caption styles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/org/[orgSlug]/caption-styles - Create new caption style
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
    const validationResult = CreateCaptionStyleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const captionStyle = await prisma.captionStyle.create({
      data: {
        ...validationResult.data,
        organizationId: org.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: captionStyle,
    }, { status: 201 });
  } catch (error) {
    console.error('Create Caption Style Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create caption style' },
      { status: 500 }
    );
  }
}
