import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { prisma } from '@repo/database';
import { profileService } from '@/lib/services/profile.service';

/**
 * POST /api/join-requests/[requestId]/approve
 * Approve a join request (Admin+ only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;

    // Authenticate user
    const userOrResponse = await requireAuth();
    if (userOrResponse instanceof NextResponse) return userOrResponse;
    const user = userOrResponse;

    // Get join request with organization
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: { organization: true },
    });

    if (!joinRequest) {
      return NextResponse.json(
        { success: false, error: 'Join request not found' },
        { status: 404 }
      );
    }

    if (joinRequest.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Join request has already been processed' },
        { status: 400 }
      );
    }

    // Check if user is admin or owner of the organization
    const userRole = await prisma.organizationMember.findUnique({
      where: { profileId: user.id },
      select: { role: true, organizationId: true },
    });

    if (!userRole || userRole.organizationId !== joinRequest.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (userRole.role === 'MEMBER') {
      return NextResponse.json(
        { success: false, error: 'Only admins and owners can approve join requests' },
        { status: 403 }
      );
    }

    // Check if requester is already a member
    const existingMember = await prisma.organizationMember.findUnique({
      where: { profileId: joinRequest.profileId },
    });

    if (existingMember) {
      // Update request status but don't create duplicate member
      await prisma.joinRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: user.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'User is already a member',
      });
    }

    // Approve the request in a transaction
    await prisma.$transaction([
      // Update join request
      prisma.joinRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: user.id,
        },
      }),
      // Add user as member
      prisma.organizationMember.create({
        data: {
          organizationId: joinRequest.organizationId,
          profileId: joinRequest.profileId,
          role: 'MEMBER',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Join request approved successfully',
    });
  } catch (error) {
    console.error('Approve Join Request Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve join request',
      },
      { status: 500 }
    );
  }
}
