import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/app/auth/actions";
import { prisma } from "@repo/database";

/**
 * POST /api/organizations/join
 * Request to join an organization by slug or join code
 * Creates a join request (requires admin approval)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { slug, joinCode } = body;

    if (!slug && !joinCode) {
      return NextResponse.json(
        { error: "Either slug or joinCode is required" },
        { status: 400 }
      );
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

    // Find organization by slug or join code
    const org = await prisma.organization.findFirst({
      where: slug
        ? { slug }
        : { joinCode },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if user already has a pending request
    const existingRequest = await prisma.joinRequest.findUnique({
      where: {
        organizationId_profileId: {
          organizationId: org.id,
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

    // Create join request
    const joinRequest = await prisma.joinRequest.create({
      data: {
        organizationId: org.id,
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
    console.error("Error creating join request:", error);
    return NextResponse.json(
      { error: "Failed to create join request" },
      { status: 500 }
    );
  }
}
