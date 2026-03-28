import Twilio from 'twilio';
import { env } from '../config/env';

const client =
  env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN
    ? Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
    : null;

interface SendSmsParams {
  to: string;
  body: string;
}

export async function sendSms({ to, body }: SendSmsParams): Promise<boolean> {
  if (!client || !env.TWILIO_FROM_NUMBER) {
    console.log('[SMS] Twilio not configured, logging SMS:');
    console.log(`  To: ${to}`);
    console.log(`  Body: ${body}`);
    return true;
  }

  try {
    await client.messages.create({
      to,
      from: env.TWILIO_FROM_NUMBER,
      body,
    });
    return true;
  } catch (error) {
    console.error('[SMS] Failed to send:', error);
    return false;
  }
}
