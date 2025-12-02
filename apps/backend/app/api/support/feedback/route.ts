import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { feedbackService } from '@/lib/services/support/feedback.service';
import { z } from 'zod';
import { prisma } from '@repo/database';

// Validation schema
const feedbackSchema = z.object({
  type: z.enum(['QUESTION', 'BUG_REPORT', 'FEATURE_REQUEST', 'GENERAL']),
  subject: z.string().min(1).max(255),
  message: z.string().min(1).max(5000),
  email: z.string().email().optional(),
  pageUrl: z.string().max(500).optional(),
});

/**
 * POST /api/support/feedback
 * Submit support feedback
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate body
    const body = await request.json();
    const validation = feedbackSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { type, subject, message, email, pageUrl } = validation.data;

    // Get user info if authenticated (optional)
    let profileId: string | undefined;
    let organizationId: string | undefined;

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        profileId = user.id;

        // Get user's organization
        const membership = await prisma.organizationMember.findUnique({
          where: { profileId: user.id },
          select: { organizationId: true },
        });

        if (membership) {
          organizationId = membership.organizationId;
        }
      }
    } catch {
      // Auth is optional for feedback
    }

    // Create feedback
    const feedback = await feedbackService.createFeedback({
      type,
      subject,
      message,
      email,
      pageUrl,
      profileId,
      organizationId,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: feedback.id,
          message: 'Thank you for your feedback!',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Error creating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
