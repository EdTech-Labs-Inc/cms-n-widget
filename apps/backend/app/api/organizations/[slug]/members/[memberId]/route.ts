import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/app/auth/actions";
import { profileService } from "@/lib/services/profile.service";
import { validateOrgAccess, isOrgAdmin } from "@/lib/context/org-context";
import { prisma } from "@repo/database";
import { MemberRole } from "@prisma/client";

type RouteContext = {
  params: Promise<{ slug: string; memberId: string }>;
};

/**
 * PATCH /api/organizations/[slug]/members/[memberId]
 * Update member role
 * Requires ADMIN role
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, memberId } = await context.params;

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
        { error: "Only admins can update member roles" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !["OWNER", "ADMIN", "MEMBER"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be OWNER, ADMIN, or MEMBER" },
        { status: 400 }
      );
    }

    // Get member to update
    const member = await prisma.organizationMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.organizationId !== org.id) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Update role
    const updated = await profileService.updateMemberRole(
      org.id,
      member.profileId,
      role as MemberRole
    );

    return NextResponse.json({ member: updated });
  } catch (error: any) {
    console.error("Error updating member role:", error);

    if (error.message?.includes("Cannot demote the last owner")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[slug]/members/[memberId]
 * Remove member from organization
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

    const { slug, memberId } = await context.params;

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
        { error: "Only admins can remove members" },
        { status: 403 }
      );
    }

    // Get member to remove
    const member = await prisma.organizationMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.organizationId !== org.id) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Remove member
    await profileService.removeMemberFromOrg(org.id, member.profileId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error removing member:", error);

    if (error.message?.includes("Cannot remove the owner")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
