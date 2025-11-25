import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/app/auth/actions";
import { validateOrgAccess, isOrgAdmin } from "@/lib/context/org-context";
import { prisma } from "@repo/database";

type RouteContext = {
  params: Promise<{ slug: string; requestId: string }>;
};

/**
 * POST /api/organizations/[slug]/requests/[requestId]/deny
 * Deny a join request
 * Requires ADMIN role
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, requestId } = await context.params;

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
        { error: "Only admins can deny join requests" },
        { status: 403 }
      );
    }

    // Get join request
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
    });

    if (!joinRequest || joinRequest.organizationId !== org.id) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      );
    }

    if (joinRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: `Join request is already ${joinRequest.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Update request status to DENIED
    const updated = await prisma.joinRequest.update({
      where: { id: requestId },
      data: {
        status: "DENIED",
        reviewedAt: new Date(),
        reviewedBy: user.id,
      },
    });

    return NextResponse.json({ joinRequest: updated });
  } catch (error) {
    console.error("Error denying join request:", error);
    return NextResponse.json(
      { error: "Failed to deny join request" },
      { status: 500 }
    );
  }
}
