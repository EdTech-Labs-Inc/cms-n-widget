import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/app/auth/actions";
import { validateOrgAccess, isOrgAdmin } from "@/lib/context/org-context";
import { prisma } from "@repo/database";
import { randomUUID } from "crypto";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

const INVITE_EXPIRY_DAYS = parseInt(
  process.env.ORG_INVITE_EXPIRY_DAYS || "7",
  10
);

/**
 * GET /api/organizations/[slug]/invites
 * List all active invites
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
        { error: "Only admins can view invites" },
        { status: 403 }
      );
    }

    // Get active invites (not expired)
    const invites = await prisma.organizationInvite.findMany({
      where: {
        organizationId: org.id,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ invites });
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/[slug]/invites
 * Create a new invite
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
        { error: "Only admins can create invites" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email } = body;

    // Validate email if provided
    if (email && typeof email !== "string") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Create invite
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    const invite = await prisma.organizationInvite.create({
      data: {
        organizationId: org.id,
        token: randomUUID(),
        email: email?.trim() || null,
        createdBy: user.id,
        expiresAt,
      },
    });

    // Build invite URL
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const host =
      request.headers.get("host") || "localhost:3000";
    const inviteUrl = `${protocol}://${host}/join/${invite.token}`;

    return NextResponse.json(
      {
        invite,
        inviteUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}
