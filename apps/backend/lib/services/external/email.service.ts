import { Resend } from 'resend';
import { config } from '../../config/constants';
import { logger } from '@repo/logging';

/**
 * Email Service - Wrapper around Resend for sending emails
 */
class EmailService {
  private client: Resend | null = null;

  private getClient(): Resend {
    if (!this.client) {
      if (!config.email.resendApiKey) {
        throw new Error('RESEND_API_KEY is not configured');
      }
      this.client = new Resend(config.email.resendApiKey);
    }
    return this.client;
  }

  /**
   * Send a support feedback notification email
   */
  async sendFeedbackNotification(params: {
    type: string;
    subject: string;
    message: string;
    userEmail?: string | null;
    userName?: string | null;
    pageUrl?: string | null;
    feedbackId: string;
  }): Promise<void> {
    const { type, subject, message, userEmail, userName, pageUrl, feedbackId } = params;

    const recipients = config.email.supportRecipients;
    if (recipients.length === 0) {
      logger.warn('[Email] No support recipients configured, skipping email');
      return;
    }

    const feedbackTypeLabel = {
      QUESTION: 'Question',
      BUG_REPORT: 'Bug Report',
      FEATURE_REQUEST: 'Feature Request',
      GENERAL: 'General Feedback',
    }[type] || type;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">New Support Feedback</h2>

        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <p style="margin: 0 0 8px 0;"><strong>Type:</strong> ${feedbackTypeLabel}</p>
          <p style="margin: 0 0 8px 0;"><strong>Subject:</strong> ${subject}</p>
          ${userName ? `<p style="margin: 0 0 8px 0;"><strong>From:</strong> ${userName}</p>` : ''}
          ${userEmail ? `<p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${userEmail}</p>` : ''}
          ${pageUrl ? `<p style="margin: 0;"><strong>Page:</strong> ${pageUrl}</p>` : ''}
        </div>

        <div style="background: #ffffff; padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #333;">Message</h3>
          <p style="white-space: pre-wrap; color: #444;">${message}</p>
        </div>

        <p style="color: #666; font-size: 12px; margin-top: 16px;">
          Feedback ID: ${feedbackId}
        </p>
      </div>
    `;

    try {
      const client = this.getClient();
      await client.emails.send({
        from: config.email.fromAddress,
        to: recipients,
        subject: `[${feedbackTypeLabel}] ${subject}`,
        html: htmlContent,
      });

      logger.info('[Email] Feedback notification sent', {
        feedbackId,
        type,
        recipients: recipients.length,
      });
    } catch (error) {
      logger.error('[Email] Failed to send feedback notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        feedbackId,
      });
      // Don't throw - email failure shouldn't break the feedback submission
    }
  }
}

export const emailService = new EmailService();
