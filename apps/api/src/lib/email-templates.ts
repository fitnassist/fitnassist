import { env } from '../config/env';

const dashboardUrl = `${env.FRONTEND_URL}/dashboard`;
const messagesUrl = `${dashboardUrl}/messages`;
const requestsUrl = `${dashboardUrl}/requests`;
const settingsUrl = `${dashboardUrl}/settings`;

const layout = (content: string) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
    ${content}
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
    <p style="font-size: 12px; color: #888;">
      You're receiving this because of your notification settings on Fitnassist.
      <a href="${settingsUrl}" style="color: #888;">Manage preferences</a>
    </p>
  </div>
`;

export const emailTemplates = {
  callbackRequest: (senderName: string, senderEmail: string, phone: string, message?: string) =>
    layout(`
      <h2 style="margin: 0 0 16px;">New callback request</h2>
      <p><strong>From:</strong> ${senderName}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Email:</strong> ${senderEmail}</p>
      ${message ? `<p><strong>Note:</strong> ${message}</p>` : ''}
      <p style="margin-top: 24px;">
        <a href="${requestsUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          View requests
        </a>
      </p>
    `),

  connectionRequest: (senderName: string, senderEmail: string, message: string) =>
    layout(`
      <h2 style="margin: 0 0 16px;">New connection request</h2>
      <p><strong>From:</strong> ${senderName}</p>
      <p><strong>Email:</strong> ${senderEmail}</p>
      <p><strong>Message:</strong></p>
      <p style="background: #f5f5f5; padding: 12px; border-radius: 6px;">${message}</p>
      <p style="margin-top: 24px;">
        <a href="${requestsUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          Accept or decline
        </a>
      </p>
    `),

  connectionAccepted: (trainerName: string, connectionId: string) =>
    layout(`
      <h2 style="margin: 0 0 16px;">Connection accepted!</h2>
      <p><strong>${trainerName}</strong> has accepted your connection request.</p>
      <p>You can now send them messages directly.</p>
      <p style="margin-top: 24px;">
        <a href="${messagesUrl}/${connectionId}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          Start chatting
        </a>
      </p>
    `),

  connectionDeclined: (trainerName: string) =>
    layout(`
      <h2 style="margin: 0 0 16px;">Connection update</h2>
      <p><strong>${trainerName}</strong> has declined your connection request.</p>
      <p>You can browse other trainers and send new connection requests.</p>
      <p style="margin-top: 24px;">
        <a href="${env.FRONTEND_URL}/trainers" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          Find trainers
        </a>
      </p>
    `),

  newMessage: (senderName: string, messagePreview: string, connectionId: string) =>
    layout(`
      <h2 style="margin: 0 0 16px;">New message from ${senderName}</h2>
      <p style="background: #f5f5f5; padding: 12px; border-radius: 6px;">${messagePreview}</p>
      <p style="margin-top: 24px;">
        <a href="${messagesUrl}/${connectionId}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          Reply
        </a>
      </p>
    `),
};
