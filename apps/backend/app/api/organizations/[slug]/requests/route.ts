import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/app/auth/actions";
import { validateOrgAccess, isOrgAdmin } from "@/lib/context/org-context";
import { prisma } from "@repo/database";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

/**
 * GET /api/organizations/[slug]/requests
 * List all pending join requests
 * Requires ADMIN role
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

    // Get org
    const org = await prisma.organization.findUnique({ where: { slug } });
    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if user is admin
    const isAdmin = await isOrgAdmin(user.id, org.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only admins can view join requests" },
        { status: 403 }
      );
    }

    // Get all join requests (filter by status if query param provided)
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const requests = await prisma.joinRequest.findMany({
      where: {
        organizationId: org.id,
        ...(status && ["PENDING", "APPROVED", "DENIED"].includes(status.toUpperCase())
          ? { status: status.toUpperCase() as any }
          : {}),
      },
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
      orderBy: {
        requestedAt: "desc",
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching join requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch join requests" },
      { status: 500 }
    );
  }
}
