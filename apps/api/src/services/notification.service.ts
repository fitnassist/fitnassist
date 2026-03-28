import { sendEmail } from '../lib/email';
import { sendSms } from '../lib/sms';
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

    if (prefs?.emailNotifyConnectionRequests) {
      await sendEmail({
        to: recipientEmail,
        subject: `Callback request from ${senderName} - Fitnassist`,
        html: emailTemplates.callbackRequest(senderName, senderEmail, phone, message),
      });
    }

    if (prefs?.smsNotifyConnectionRequests && prefs.phoneNumber) {
      await sendSms({
        to: prefs.phoneNumber,
        body: `Fitnassist: ${senderName} has requested a callback. Check your dashboard for details.`,
      });
    }
  },

  /**
   * Notify a trainer about a new connection request.
   * Respects the trainer's notification preferences.
   */
  async notifyConnectionRequest(
    recipientUserId: string,
    recipientEmail: string,
    senderName: string,
    senderEmail: string,
    message: string,
  ) {
    const prefs = await userRepository.getNotificationPreferences(recipientUserId);

    if (prefs?.emailNotifyConnectionRequests) {
      await sendEmail({
        to: recipientEmail,
        subject: `Connection request from ${senderName} - Fitnassist`,
        html: emailTemplates.connectionRequest(senderName, senderEmail, message),
      });
    }

    if (prefs?.smsNotifyConnectionRequests && prefs.phoneNumber) {
      await sendSms({
        to: prefs.phoneNumber,
        body: `Fitnassist: ${senderName} wants to connect with you. Check your dashboard to respond.`,
      });
    }
  },

  /**
   * Notify a trainee that their connection was accepted.
   * Respects the trainee's notification preferences.
   */
  async notifyConnectionAccepted(
    recipientUserId: string,
    recipientEmail: string,
    trainerName: string,
    connectionId: string,
  ) {
    const prefs = await userRepository.getNotificationPreferences(recipientUserId);

    if (prefs?.emailNotifyConnectionRequests) {
      await sendEmail({
        to: recipientEmail,
        subject: `${trainerName} accepted your connection request! - Fitnassist`,
        html: emailTemplates.connectionAccepted(trainerName, connectionId),
      });
    }

    if (prefs?.smsNotifyConnectionRequests && prefs.phoneNumber) {
      await sendSms({
        to: prefs.phoneNumber,
        body: `Fitnassist: ${trainerName} accepted your connection request!`,
      });
    }
  },

  /**
   * Notify a trainee that their connection was declined.
   * Respects the trainee's notification preferences.
   */
  async notifyConnectionDeclined(
    recipientUserId: string,
    recipientEmail: string,
    trainerName: string,
  ) {
    const prefs = await userRepository.getNotificationPreferences(recipientUserId);

    if (prefs?.emailNotifyConnectionRequests) {
      await sendEmail({
        to: recipientEmail,
        subject: `Connection update - Fitnassist`,
        html: emailTemplates.connectionDeclined(trainerName),
      });
    }

    if (prefs?.smsNotifyConnectionRequests && prefs.phoneNumber) {
      await sendSms({
        to: prefs.phoneNumber,
        body: `Fitnassist: Your connection request update — check your dashboard for details.`,
      });
    }
  },

  /**
   * Notify a user about a new message.
   * Respects the recipient's notification preferences.
   */
  async notifyNewMessage(
    recipientUserId: string,
    recipientEmail: string,
    senderName: string,
    messageContent: string,
    connectionId: string,
  ) {
    const prefs = await userRepository.getNotificationPreferences(recipientUserId);

    if (prefs?.emailNotifyMessages) {
      // Truncate long messages for the email preview
      const preview = messageContent.length > 200
        ? messageContent.slice(0, 200) + '...'
        : messageContent;

      await sendEmail({
        to: recipientEmail,
        subject: `New message from ${senderName} - Fitnassist`,
        html: emailTemplates.newMessage(senderName, preview, connectionId),
      });
    }

    if (prefs?.smsNotifyMessages && prefs.phoneNumber) {
      await sendSms({
        to: prefs.phoneNumber,
        body: `Fitnassist: New message from ${senderName}. Open the app to reply.`,
      });
    }
  },
};
