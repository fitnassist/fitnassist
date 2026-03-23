import { sendEmail } from '../lib/email';
import { emailTemplates } from '../lib/email-templates';
import { userRepository } from '../repositories/user.repository';

export const notificationService = {
  /**
   * Notify a trainer about a new callback request.
   * Respects the trainer's emailNotifyConnectionRequests preference.
   */
  async notifyCallbackRequest(
    recipientUserId: string,
    recipientEmail: string,
    senderName: string,
    senderEmail: string,
    phone: string,
    message?: string,
  ) {
    const prefs = await userRepository.getNotificationPreferences(recipientUserId);
    if (!prefs?.emailNotifyConnectionRequests) return;

    await sendEmail({
      to: recipientEmail,
      subject: `Callback request from ${senderName} - Fitnassist`,
      html: emailTemplates.callbackRequest(senderName, senderEmail, phone, message),
    });
  },

  /**
   * Notify a trainer about a new connection request.
   * Respects the trainer's emailNotifyConnectionRequests preference.
   */
  async notifyConnectionRequest(
    recipientUserId: string,
    recipientEmail: string,
    senderName: string,
    senderEmail: string,
    message: string,
  ) {
    const prefs = await userRepository.getNotificationPreferences(recipientUserId);
    if (!prefs?.emailNotifyConnectionRequests) return;

    await sendEmail({
      to: recipientEmail,
      subject: `Connection request from ${senderName} - Fitnassist`,
      html: emailTemplates.connectionRequest(senderName, senderEmail, message),
    });
  },

  /**
   * Notify a trainee that their connection was accepted.
   * Respects the trainee's emailNotifyConnectionRequests preference.
   */
  async notifyConnectionAccepted(
    recipientUserId: string,
    recipientEmail: string,
    trainerName: string,
    connectionId: string,
  ) {
    const prefs = await userRepository.getNotificationPreferences(recipientUserId);
    if (!prefs?.emailNotifyConnectionRequests) return;

    await sendEmail({
      to: recipientEmail,
      subject: `${trainerName} accepted your connection request! - Fitnassist`,
      html: emailTemplates.connectionAccepted(trainerName, connectionId),
    });
  },

  /**
   * Notify a trainee that their connection was declined.
   * Respects the trainee's emailNotifyConnectionRequests preference.
   */
  async notifyConnectionDeclined(
    recipientUserId: string,
    recipientEmail: string,
    trainerName: string,
  ) {
    const prefs = await userRepository.getNotificationPreferences(recipientUserId);
    if (!prefs?.emailNotifyConnectionRequests) return;

    await sendEmail({
      to: recipientEmail,
      subject: `Connection update - Fitnassist`,
      html: emailTemplates.connectionDeclined(trainerName),
    });
  },

  /**
   * Notify a user about a new message.
   * Respects the recipient's emailNotifyMessages preference.
   */
  async notifyNewMessage(
    recipientUserId: string,
    recipientEmail: string,
    senderName: string,
    messageContent: string,
    connectionId: string,
  ) {
    const prefs = await userRepository.getNotificationPreferences(recipientUserId);
    if (!prefs?.emailNotifyMessages) return;

    // Truncate long messages for the email preview
    const preview = messageContent.length > 200
      ? messageContent.slice(0, 200) + '...'
      : messageContent;

    await sendEmail({
      to: recipientEmail,
      subject: `New message from ${senderName} - Fitnassist`,
      html: emailTemplates.newMessage(senderName, preview, connectionId),
    });
  },
};
