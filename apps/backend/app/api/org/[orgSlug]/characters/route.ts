import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/database';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess } from '@/lib/context/org-context';

/**
 * GET /api/org/[orgSlug]/characters - Get all characters for organization
 *
 * Returns characters with their linked voice information for video generation.
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

    // Fetch all characters for the organization with their linked voice
    const characters = await prisma.character.findMany({
      where: {
        organizationId: org.id,
      },
      include: {
        voice: {
          select: {
            id: true,
            name: true,
            elevenlabsVoiceId: true,
            gender: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        characters,
        total: characters.length,
      },
    });
  } catch (error) {
    console.error('Get Characters Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch characters',
      },
      { status: 500 }
    );
  }
}
