import { NextRequest, NextResponse } from "next/server";
import { getUserWithOrg } from "@/app/auth/actions";

/**
 * GET /api/auth/user-with-org
 * Get current user with organization info
 */
export async function GET(request: NextRequest) {
  try {
    const result = await getUserWithOrg();

    if (!result.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({
      user: result.user,
      profile: result.profile,
      organization: result.organization,
    });
  } catch (error) {
    console.error("Error getting user with org:", error);
    return NextResponse.json(
      { error: "Failed to get user info" },
      { status: 500 }
    );
  }
}
