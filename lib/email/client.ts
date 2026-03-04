import { logger } from '@/lib/logger';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

interface SendEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
}

interface BrevoErrorResponse {
  message?: string;
  code?: string;
}

/**
 * Sends a transactional email via Brevo REST API.
 * Gracefully skips when BREVO_API_KEY or BREVO_SENDER_EMAIL are not configured.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? 'Wealth Intel';

  if (!apiKey || !senderEmail) {
    logger.warn('[email] BREVO_API_KEY or BREVO_SENDER_EMAIL not configured, skipping');
    return false;
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.htmlContent,
      }),
    });

    if (!response.ok) {
      const error: BrevoErrorResponse = await response.json().catch(() => ({}));
      logger.error(`[email] Brevo API error ${response.status}: ${error.message ?? 'Unknown'}`);
      return false;
    }

    logger.info(`[email] Sent "${options.subject}" to ${options.to}`);
    return true;
  } catch (err) {
    logger.error(`[email] Failed to send: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return false;
  }
}
