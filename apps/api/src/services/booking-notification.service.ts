import { sendEmail } from '../lib/email';
import { emailTemplates } from '../lib/email-templates';
import { userRepository } from '../repositories/user.repository';
import { bookingRepository } from '../repositories/booking.repository';
import { inAppNotificationService } from './in-app-notification.service';
import { prisma } from '../lib/prisma';

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const bookingNotificationService = {
  /**
   * Send confirmation emails to both trainer and client after a booking is created.
   */
  async sendBookingConfirmation(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        trainer: {
          select: {
            displayName: true,
            userId: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        clientRoster: {
          include: {
            connection: {
              include: {
                sender: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        location: true,
      },
    });

    if (!booking) return;

    const trainerUser = booking.trainer.user;
    const clientUser = booking.clientRoster.connection.sender;
    const trainerName = booking.trainer.displayName;
    const clientName = clientUser?.name ?? 'Client';
    const dateStr = formatDate(booking.date);
    const locationName = booking.location?.name ?? booking.clientAddress ?? undefined;

    const baseData = {
      date: dateStr,
      startTime: booking.startTime,
      endTime: booking.endTime,
      durationMin: booking.durationMin,
      locationName,
      notes: booking.notes ?? undefined,
    };

    // Notify trainer
    if (trainerUser?.email) {
      const prefs = await userRepository.getNotificationPreferences(trainerUser.id);
      if (prefs?.emailNotifyBookings) {
        await sendEmail({
          to: trainerUser.email,
          subject: `New booking with ${clientName} - Fitnassist`,
          html: emailTemplates.bookingConfirmation({
            ...baseData,
            recipientName: trainerUser.name ?? trainerName,
            otherPartyName: clientName,
            isTrainer: true,
          }),
        });
      }
    }

    // Notify client
    if (clientUser?.email) {
      const prefs = await userRepository.getNotificationPreferences(clientUser.id);
      if (prefs?.emailNotifyBookings) {
        await sendEmail({
          to: clientUser.email,
          subject: `Booking confirmed with ${trainerName} - Fitnassist`,
          html: emailTemplates.bookingConfirmation({
            ...baseData,
            recipientName: clientName,
            otherPartyName: trainerName,
            isTrainer: false,
          }),
        });
      }
    }
  },

  /**
   * Send cancellation emails to the other party (not the one who cancelled).
   */
  async sendBookingCancellation(
    bookingId: string,
    cancelledByUserId: string,
    reason?: string
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        trainer: {
          select: {
            displayName: true,
            userId: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        clientRoster: {
          include: {
            connection: {
              include: {
                sender: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!booking) return;

    const trainerUser = booking.trainer.user;
    const clientUser = booking.clientRoster.connection.sender;
    const trainerName = booking.trainer.displayName;
    const clientName = clientUser?.name ?? 'Client';
    const dateStr = formatDate(booking.date);

    const isTrainerCancelling = cancelledByUserId === trainerUser?.id;

    const baseData = {
      date: dateStr,
      startTime: booking.startTime,
      endTime: booking.endTime,
      reason,
    };

    // Notify the other party
    if (isTrainerCancelling && clientUser?.email) {
      const prefs = await userRepository.getNotificationPreferences(clientUser.id);
      if (prefs?.emailNotifyBookings) {
        await sendEmail({
          to: clientUser.email,
          subject: `Booking cancelled by ${trainerName} - Fitnassist`,
          html: emailTemplates.bookingCancellation({
            ...baseData,
            recipientName: clientName,
            cancelledByName: trainerName,
          }),
        });
      }
    } else if (!isTrainerCancelling && trainerUser?.email) {
      const prefs = await userRepository.getNotificationPreferences(trainerUser.id);
      if (prefs?.emailNotifyBookings) {
        await sendEmail({
          to: trainerUser.email,
          subject: `Booking cancelled by ${clientName} - Fitnassist`,
          html: emailTemplates.bookingCancellation({
            ...baseData,
            recipientName: trainerUser.name ?? trainerName,
            cancelledByName: clientName,
          }),
        });
      }
    }
  },

  /**
   * Send reminder emails for bookings happening tomorrow.
   * Idempotent — only sends to bookings where reminderSentAt is null.
   */
  async sendBookingReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const bookings = await bookingRepository.findRemindable(tomorrow);

    let sent = 0;
    let skipped = 0;

    for (const booking of bookings) {
      const trainerUser = booking.trainer.user;
      const clientUser = booking.clientRoster.connection.sender;
      const trainerName = booking.trainer.displayName;
      const clientName = clientUser?.name ?? 'Client';
      const dateStr = formatDate(booking.date);
      const locationName = booking.location?.name ?? undefined;

      const baseData = {
        date: dateStr,
        startTime: booking.startTime,
        endTime: booking.endTime,
        durationMin: booking.durationMin,
        locationName,
        notes: booking.notes ?? undefined,
      };

      // Notify trainer
      if (trainerUser?.email) {
        const prefs = await userRepository.getNotificationPreferences(trainerUser.id);
        if (prefs?.emailNotifyBookingReminders) {
          await sendEmail({
            to: trainerUser.email,
            subject: `Reminder: Session with ${clientName} tomorrow - Fitnassist`,
            html: emailTemplates.bookingReminder({
              ...baseData,
              recipientName: trainerUser.name ?? trainerName,
              otherPartyName: clientName,
              isTrainer: true,
            }),
          });
        }
      }

      // Notify client
      if (clientUser?.email) {
        const prefs = await userRepository.getNotificationPreferences(clientUser.id);
        if (prefs?.emailNotifyBookingReminders) {
          await sendEmail({
            to: clientUser.email,
            subject: `Reminder: Session with ${trainerName} tomorrow - Fitnassist`,
            html: emailTemplates.bookingReminder({
              ...baseData,
              recipientName: clientName,
              otherPartyName: trainerName,
              isTrainer: false,
            }),
          });
        }
      }

      // In-app reminder notifications
      if (trainerUser?.id) {
        inAppNotificationService.notify({
          userId: trainerUser.id,
          type: 'BOOKING_REMINDER',
          title: `Reminder: session with ${clientName} tomorrow at ${booking.startTime}`,
          link: '/dashboard/bookings',
        }).catch(console.error);
      }
      if (clientUser?.id) {
        inAppNotificationService.notify({
          userId: clientUser.id,
          type: 'BOOKING_REMINDER',
          title: `Reminder: session with ${trainerName} tomorrow at ${booking.startTime}`,
          link: '/dashboard/bookings',
        }).catch(console.error);
      }

      // Mark reminder as sent (idempotent)
      await bookingRepository.markReminderSent(booking.id);
      sent++;
    }

    console.log(`[BookingReminders] Sent ${sent} reminders, skipped ${skipped}`);
    return { sent, skipped };
  },
};
