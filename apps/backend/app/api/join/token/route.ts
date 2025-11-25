import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/app/auth/actions";
import { prisma } from "@repo/database";

/**
 * POST /api/join/token
 * Redeem an invite token
 * Creates a join request (requires admin approval even with valid token)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    // Check if user already belongs to an organization
    const existingMembership = await prisma.organizationMember.findUnique({
      where: { profileId: user.id },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "You already belong to an organization" },
        { status: 409 }
      );
    }

    // Find invite
    const invite = await prisma.organizationInvite.findUnique({
      where: { token },
      include: { organization: true },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid or expired invite token" },
        { status: 404 }
      );
    }

    // Check if expired
    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invite has expired" },
        { status: 410 }
      );
    }

    // Check if email-specific invite matches user email
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
    });

    if (invite.email && profile && invite.email !== profile.email) {
      return NextResponse.json(
        { error: "This invite is for a different email address" },
        { status: 403 }
      );
    }

    // Check if user already has a pending request
    const existingRequest = await prisma.joinRequest.findUnique({
      where: {
        organizationId_profileId: {
          organizationId: invite.organizationId,
          profileId: user.id,
        },
      },
    });

    if (existingRequest) {
      if (existingRequest.status === "PENDING") {
        return NextResponse.json(
          {
            message: "You already have a pending request to join this organization",
            joinRequest: existingRequest,
          },
          { status: 200 }
        );
      } else if (existingRequest.status === "DENIED") {
        return NextResponse.json(
          { error: "Your previous request to join was denied" },
          { status: 403 }
        );
      }
    }

    // Create join request (even with valid token, requires approval)
    const joinRequest = await prisma.joinRequest.create({
      data: {
        organizationId: invite.organizationId,
        profileId: user.id,
        status: "PENDING",
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Join request created successfully. Waiting for admin approval.",
        joinRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error redeeming invite token:", error);
    return NextResponse.json(
      { error: "Failed to process invite" },
      { status: 500 }
    );
  }
}
