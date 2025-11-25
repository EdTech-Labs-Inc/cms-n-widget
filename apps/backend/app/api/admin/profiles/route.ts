import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { profileService } from '@/lib/services/profile.service';

/**
 * GET /api/admin/profiles - Get all profiles (admin only)
 */
export async function GET(request: NextRequest) {
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

    // Check if user is admin
    const isAdmin = await profileService.isAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Admin access required',
        },
        { status: 403 }
      );
    }

    // Get all profiles
    const profiles = await profileService.getAllProfiles();

    return NextResponse.json({
      success: true,
      data: profiles,
    });
  } catch (error) {
    console.error('Get Profiles Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch profiles',
      },
      { status: 500 }
    );
  }
}
