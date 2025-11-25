import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { prisma } from '@repo/database';

/**
 * POST /api/join-requests/[requestId]/deny
 * Deny a join request (Admin+ only)
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

    // Get join request
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
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
        { success: false, error: 'Only admins and owners can deny join requests' },
        { status: 403 }
      );
    }

    // Deny the request
    await prisma.joinRequest.update({
      where: { id: requestId },
      data: {
        status: 'DENIED',
        reviewedAt: new Date(),
        reviewedBy: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Join request denied successfully',
    });
  } catch (error) {
    console.error('Deny Join Request Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deny join request',
      },
      { status: 500 }
    );
  }
}
