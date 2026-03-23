import { Resend } from 'resend';
import { env } from '../config/env';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  if (!resend) {
    console.log('[Email] Resend not configured, logging email:');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    return true;
  }

  try {
    await resend.emails.send({
      from: env.FROM_EMAIL,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return false;
  }
}
