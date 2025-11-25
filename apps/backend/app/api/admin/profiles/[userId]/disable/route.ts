import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { profileService } from "@/lib/services/profile.service";

/**
 * POST /api/admin/profiles/[userId]/disable - Disable a user profile (admin only)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await context.params;
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
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
          error: "Forbidden - Admin access required",
        },
        { status: 403 }
      );
    }

    // Disable the profile
    const profile = await profileService.disableProfile(params.userId);

    return NextResponse.json({
      success: true,
      data: profile,
      message: "User disabled successfully",
    });
  } catch (error) {
    console.error("Disable Profile Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to disable profile",
      },
      { status: 500 }
    );
  }
}
