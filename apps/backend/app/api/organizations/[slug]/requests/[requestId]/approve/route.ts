import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/app/auth/actions";
import { profileService } from "@/lib/services/profile.service";
import { validateOrgAccess, isOrgAdmin } from "@/lib/context/org-context";
import { prisma } from "@repo/database";

type RouteContext = {
  params: Promise<{ slug: string; requestId: string }>;
};

/**
 * POST /api/organizations/[slug]/requests/[requestId]/approve
 * Approve a join request
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
        { error: "Only admins can approve join requests" },
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

    // Add member to organization and update request in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Add member
      const membership = await profileService.addMemberToOrg(
        org.id,
        joinRequest.profileId,
        "MEMBER"
      );

      // Update join request
      const updatedRequest = await tx.joinRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedBy: user.id,
        },
      });

      return { membership, joinRequest: updatedRequest };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error approving join request:", error);

    if (error.message?.includes("already belongs to an organization")) {
      return NextResponse.json(
        { error: "User already belongs to an organization" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to approve join request" },
      { status: 500 }
    );
  }
}
