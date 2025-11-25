import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/app/auth/actions";
import { validateOrgAccess, isOrgAdmin } from "@/lib/context/org-context";
import { prisma } from "@repo/database";

type RouteContext = {
  params: Promise<{ slug: string; inviteId: string }>;
};

/**
 * DELETE /api/organizations/[slug]/invites/[inviteId]
 * Revoke an invite
 * Requires ADMIN role
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, inviteId } = await context.params;

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
        { error: "Only admins can revoke invites" },
        { status: 403 }
      );
    }

    // Get invite
    const invite = await prisma.organizationInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite || invite.organizationId !== org.id) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Delete invite
    await prisma.organizationInvite.delete({
      where: { id: inviteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking invite:", error);
    return NextResponse.json(
      { error: "Failed to revoke invite" },
      { status: 500 }
    );
  }
}
