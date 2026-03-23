import { sendEmail } from '../lib/email';
import { env } from '../config/env';
import type { SupportContactInput } from '@fitnassist/schemas';

export const supportService = {
  async submitEnquiry(input: SupportContactInput) {
    const { name, email, subject, message } = input;

    await sendEmail({
      to: env.SUPPORT_EMAIL,
      subject: `[Fitnassist Support] ${subject}`,
      html: `
        <h2>New support enquiry</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <p>${message.replace(/\n/g, '<br />')}</p>
      `,
    });

    // Send confirmation to the user
    await sendEmail({
      to: email,
      subject: 'We received your message - Fitnassist',
      html: `
        <h2>Thanks for contacting us, ${name}</h2>
        <p>We've received your message and will get back to you as soon as possible.</p>
        <hr />
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Your message:</strong></p>
        <p>${message.replace(/\n/g, '<br />')}</p>
        <hr />
        <p>The Fitnassist Team</p>
      `,
    });
  },
};
