import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { profileService } from "@/lib/services/profile.service";
import { prisma } from "@repo/database";

/**
 * POST /api/organizations
 * Create a new organization
 * User must not already belong to an organization
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API] POST /api/organizations - Starting');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[API] User:', user ? { id: user.id, email: user.email } : 'null');

    if (!user) {
      console.log('[API] Unauthorized - no user');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;
    console.log('[API] Request body:', { name });

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      console.log('[API] Invalid name');
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      console.log('[API] Name too long');
      return NextResponse.json(
        { error: "Organization name must be less than 100 characters" },
        { status: 400 }
      );
    }

    console.log('[API] Creating organization for user:', user.id);
    // Create organization (will throw if user already has one)
    const result = await profileService.createOrganization(user.id, name.trim());
    console.log('[API] Organization created:', result.organization.id);

    return NextResponse.json(
      {
        organization: result.organization,
        membership: result.membership,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API] Error creating organization:", error);
    console.error("[API] Error stack:", error.stack);

    if (error.message === "User already belongs to an organization") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Failed to create organization", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/organizations/search?q=name
 * Search for organizations by name
 * Public endpoint (limited info returned)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Search organizations by name (case-insensitive)
    const organizations = await prisma.organization.findMany({
      where: {
        name: {
          contains: query.trim(),
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        // Don't return join code or member info for security
      },
      take: 10, // Limit results
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error("Error searching organizations:", error);
    return NextResponse.json(
      { error: "Failed to search organizations" },
      { status: 500 }
    );
  }
}
