import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/app/auth/actions";
import { profileService } from "@/lib/services/profile.service";
import { validateOrgAccess, isOrgAdmin } from "@/lib/context/org-context";
import { prisma } from "@repo/database";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

/**
 * GET /api/organizations/[slug]/members
 * List all members of the organization
 * Requires MEMBER role (any member can view)
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await context.params;

    // Validate user has access
    const hasAccess = await validateOrgAccess(user.id, slug);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get org with members
    const org = await prisma.organization.findUnique({
      where: { slug },
      include: {
        members: {
          include: {
            profile: {
              select: {
                id: true,
                email: true,
                fullName: true,
                createdAt: true,
              },
            },
          },
          orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        },
      },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ members: org.members });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
