import { prisma } from '@repo/database';
import { emailService } from '../external/email.service';
import { logger } from '@repo/logging';
import type { FeedbackType } from '@prisma/client';

interface CreateFeedbackInput {
  type: FeedbackType;
  subject: string;
  message: string;
  email?: string;
  pageUrl?: string;
  profileId?: string;
  organizationId?: string;
}

interface FeedbackWithProfile {
  id: string;
  type: FeedbackType;
  subject: string;
  message: string;
  email: string | null;
  pageUrl: string | null;
  status: string;
  createdAt: Date;
  profile?: {
    fullName: string | null;
    email: string;
  } | null;
}

/**
 * Feedback Service - Handles support feedback creation and management
 */
class FeedbackService {
  /**
   * Create a new feedback submission and send email notification
   */
  async createFeedback(input: CreateFeedbackInput): Promise<FeedbackWithProfile> {
    const { type, subject, message, email, pageUrl, profileId, organizationId } = input;

    logger.info('[Feedback] Creating feedback', { type, subject, profileId });

    // Create the feedback record
    const feedback = await prisma.supportFeedback.create({
      data: {
        type,
        subject,
        message,
        email,
        pageUrl,
        profileId,
        organizationId,
      },
      include: {
        profile: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    logger.info('[Feedback] Feedback created', { feedbackId: feedback.id });

    // Send email notification (non-blocking)
    emailService.sendFeedbackNotification({
      type,
      subject,
      message,
      userEmail: feedback.profile?.email || email,
      userName: feedback.profile?.fullName,
      pageUrl,
      feedbackId: feedback.id,
    }).catch((error) => {
      logger.error('[Feedback] Failed to send email notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        feedbackId: feedback.id,
      });
    });

    return feedback;
  }
}

export const feedbackService = new FeedbackService();
