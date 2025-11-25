import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/app/auth/actions";
import { profileService } from "@/lib/services/profile.service";
import {
  getOrgWithMembers,
  validateOrgAccess,
  isOrgAdmin,
  isOrgOwner,
} from "@/lib/context/org-context";
import { prisma } from "@repo/database";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

/**
 * GET /api/organizations/[slug]
 * Get organization details with members
 * Requires user to be a member of the organization
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

    // Validate user has access to this org
    const hasAccess = await validateOrgAccess(user.id, slug);
    if (!hasAccess) {
      // Check if platform admin
      const isPlatformAdmin = await profileService.isAdmin(user.id);
      if (!isPlatformAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const organization = await getOrgWithMembers(slug);
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ organization });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organizations/[slug]
 * Update organization details (name, slug)
 * Requires ADMIN or OWNER role
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

    const { slug } = await context.params;

    // Validate user has access
    const hasAccess = await validateOrgAccess(user.id, slug);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get org to check permissions
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
        { error: "Only admins can update organization" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, slug: newSlug } = body;

    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Invalid organization name" },
          { status: 400 }
        );
      }
      if (name.length > 100) {
        return NextResponse.json(
          { error: "Organization name must be less than 100 characters" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (newSlug !== undefined) {
      if (typeof newSlug !== "string" || newSlug.trim().length === 0) {
        return NextResponse.json(
          { error: "Invalid organization slug" },
          { status: 400 }
        );
      }
      if (!/^[a-z0-9-]+$/.test(newSlug)) {
        return NextResponse.json(
          { error: "Slug can only contain lowercase letters, numbers, and hyphens" },
          { status: 400 }
        );
      }
      // Check if slug is taken
      const existing = await prisma.organization.findUnique({
        where: { slug: newSlug },
      });
      if (existing && existing.id !== org.id) {
        return NextResponse.json(
          { error: "Slug is already taken" },
          { status: 409 }
        );
      }
      updateData.slug = newSlug.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.organization.update({
      where: { id: org.id },
      data: updateData,
    });

    return NextResponse.json({ organization: updated });
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[slug]
 * Delete organization
 * Requires OWNER role
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

    const { slug } = await context.params;

    // Get org
    const org = await prisma.organization.findUnique({ where: { slug } });
    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if user is owner
    const isOwner = await isOrgOwner(user.id, org.id);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Only the owner can delete the organization" },
        { status: 403 }
      );
    }

    // Delete organization (cascades to all members, articles, etc.)
    await profileService.deleteOrganization(org.id, user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete organization" },
      { status: 500 }
    );
  }
}
