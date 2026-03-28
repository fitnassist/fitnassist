import { sendEmail } from '../lib/email';
import { sendSms } from '../lib/sms';
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

const getBookingWithParties = async (bookingId: string) => {
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
      suggestions: {
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        include: { suggestor: { select: { name: true } } },
      },
    },
  });

  if (!booking) return null;

  const trainerUser = booking.trainer.user;
  const clientUser = booking.clientRoster.connection.sender;
  const trainerName = booking.trainer.displayName;
  const clientName = clientUser?.name ?? 'Client';

  return { booking, trainerUser, clientUser, trainerName, clientName };
};

export const bookingNotificationService = {
  /**
   * Send pending booking notification to the confirming party.
   */
  async sendBookingPending(bookingId: string) {
    const result = await getBookingWithParties(bookingId);
    if (!result) return;
    const { booking, trainerUser, clientUser, trainerName, clientName } = result;

    const dateStr = formatDate(booking.date);
    const locationName = booking.location?.name ?? booking.clientAddress ?? undefined;
    const isTrainerInitiated = booking.initiatedBy === trainerUser?.id;

    // Send to the confirming party
    const recipient = isTrainerInitiated ? clientUser : trainerUser;
    const requesterName = isTrainerInitiated ? trainerName : clientName;

    if (recipient?.email) {
      const prefs = await userRepository.getNotificationPreferences(recipient.id);
      if (prefs?.emailNotifyBookings) {
        await sendEmail({
          to: recipient.email,
          subject: `Session request from ${requesterName} - Fitnassist`,
          html: emailTemplates.bookingPending({
            recipientName: recipient.name ?? 'there',
            requesterName,
            date: dateStr,
            startTime: booking.startTime,
            endTime: booking.endTime,
            durationMin: booking.durationMin,
            locationName,
            notes: booking.notes ?? undefined,
            sessionType: booking.sessionType,
          }),
        });
      }

      if (prefs?.smsNotifyBookings && prefs.phoneNumber) {
        await sendSms({
          to: prefs.phoneNumber,
          body: `Fitnassist: ${requesterName} has requested a session on ${dateStr} at ${booking.startTime}. Check your dashboard to respond.`,
        });
      }
    }
  },

  /**
   * Send confirmation emails to both trainer and client after a booking is confirmed.
   */
  async sendBookingConfirmation(bookingId: string) {
    const result = await getBookingWithParties(bookingId);
    if (!result) return;
    const { booking, trainerUser, clientUser, trainerName, clientName } = result;

    const dateStr = formatDate(booking.date);
    const locationName = booking.location?.name ?? booking.clientAddress ?? undefined;

    const baseData = {
      date: dateStr,
      startTime: booking.startTime,
      endTime: booking.endTime,
      durationMin: booking.durationMin,
      locationName,
      notes: booking.notes ?? undefined,
      sessionType: booking.sessionType,
      bookingId: booking.id,
    };

    if (trainerUser?.email) {
      const trainerPrefs = await userRepository.getNotificationPreferences(trainerUser.id);
      if (trainerPrefs?.emailNotifyBookings) {
        await sendEmail({
          to: trainerUser.email,
          subject: `Booking confirmed with ${clientName} - Fitnassist`,
          html: emailTemplates.bookingConfirmation({
            ...baseData,
            recipientName: trainerUser.name ?? trainerName,
            otherPartyName: clientName,
            isTrainer: true,
          }),
        });
      }

      if (trainerPrefs?.smsNotifyBookings && trainerPrefs.phoneNumber) {
        await sendSms({
          to: trainerPrefs.phoneNumber,
          body: `Fitnassist: Session confirmed with ${clientName} on ${dateStr} at ${booking.startTime}.`,
        });
      }
    }

    if (clientUser?.email) {
      const clientPrefs = await userRepository.getNotificationPreferences(clientUser.id);
      if (clientPrefs?.emailNotifyBookings) {
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

      if (clientPrefs?.smsNotifyBookings && clientPrefs.phoneNumber) {
        await sendSms({
          to: clientPrefs.phoneNumber,
          body: `Fitnassist: Session confirmed with ${trainerName} on ${dateStr} at ${booking.startTime}.`,
        });
      }
    }
  },

  /**
   * Send decline notification to the initiator.
   */
  async sendBookingDeclined(bookingId: string) {
    const result = await getBookingWithParties(bookingId);
    if (!result) return;
    const { booking, trainerUser, clientUser, trainerName, clientName } = result;

    const dateStr = formatDate(booking.date);
    const isTrainerInitiated = booking.initiatedBy === trainerUser?.id;

    // Send to the initiator (who got declined)
    const recipient = isTrainerInitiated ? trainerUser : clientUser;
    const declinedByName = isTrainerInitiated ? clientName : trainerName;

    if (recipient?.email) {
      const prefs = await userRepository.getNotificationPreferences(recipient.id);
      if (prefs?.emailNotifyBookings) {
        await sendEmail({
          to: recipient.email,
          subject: `Session request declined - Fitnassist`,
          html: emailTemplates.bookingDeclined({
            recipientName: recipient.name ?? 'there',
            declinedByName,
            date: dateStr,
            startTime: booking.startTime,
            endTime: booking.endTime,
            reason: booking.declineReason ?? undefined,
          }),
        });
      }

      if (prefs?.smsNotifyBookings && prefs.phoneNumber) {
        await sendSms({
          to: prefs.phoneNumber,
          body: `Fitnassist: Your session request for ${dateStr} at ${booking.startTime} was declined by ${declinedByName}.`,
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
    const result = await getBookingWithParties(bookingId);
    if (!result) return;
    const { booking, trainerUser, clientUser, trainerName, clientName } = result;

    const dateStr = formatDate(booking.date);
    const isTrainerCancelling = cancelledByUserId === trainerUser?.id;

    const baseData = {
      date: dateStr,
      startTime: booking.startTime,
      endTime: booking.endTime,
      reason,
    };

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

      if (prefs?.smsNotifyBookings && prefs.phoneNumber) {
        await sendSms({
          to: prefs.phoneNumber,
          body: `Fitnassist: Your session on ${dateStr} at ${booking.startTime} has been cancelled by ${trainerName}.`,
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

      if (prefs?.smsNotifyBookings && prefs.phoneNumber) {
        await sendSms({
          to: prefs.phoneNumber,
          body: `Fitnassist: Your session on ${dateStr} at ${booking.startTime} has been cancelled by ${clientName}.`,
        });
      }
    }
  },

  /**
   * Send reschedule notification to the other party.
   */
  async sendBookingRescheduled(newBookingId: string, oldBookingId: string) {
    const [newResult, oldResult] = await Promise.all([
      getBookingWithParties(newBookingId),
      getBookingWithParties(oldBookingId),
    ]);
    if (!newResult || !oldResult) return;

    const { booking: newBooking, trainerUser, clientUser, trainerName, clientName } = newResult;
    const { booking: oldBooking } = oldResult;

    const isTrainerRescheduling = newBooking.initiatedBy === trainerUser?.id;
    const recipient = isTrainerRescheduling ? clientUser : trainerUser;
    const rescheduledByName = isTrainerRescheduling ? trainerName : clientName;

    if (recipient?.email) {
      const prefs = await userRepository.getNotificationPreferences(recipient.id);
      if (prefs?.emailNotifyBookings) {
        await sendEmail({
          to: recipient.email,
          subject: `Session rescheduled by ${rescheduledByName} - Fitnassist`,
          html: emailTemplates.bookingRescheduled({
            recipientName: recipient.name ?? 'there',
            rescheduledByName,
            oldDate: formatDate(oldBooking.date),
            oldStartTime: oldBooking.startTime,
            newDate: formatDate(newBooking.date),
            newStartTime: newBooking.startTime,
            newEndTime: newBooking.endTime,
            durationMin: newBooking.durationMin,
          }),
        });
      }

      if (prefs?.smsNotifyBookings && prefs.phoneNumber) {
        await sendSms({
          to: prefs.phoneNumber,
          body: `Fitnassist: ${rescheduledByName} rescheduled your session to ${formatDate(newBooking.date)} at ${newBooking.startTime}. Check your dashboard for details.`,
        });
      }
    }
  },

  /**
   * Send suggestion notification to the other party.
   */
  async sendBookingSuggestion(bookingId: string) {
    const result = await getBookingWithParties(bookingId);
    if (!result) return;
    const { booking, trainerUser, clientUser, trainerName, clientName } = result;

    if (!booking.suggestions.length) return;

    const suggestorUserId = booking.suggestions[0]!.suggestedBy;
    const isTrainerSuggesting = suggestorUserId === trainerUser?.id;
    const recipient = isTrainerSuggesting ? clientUser : trainerUser;
    const suggestorName = isTrainerSuggesting ? trainerName : clientName;

    if (recipient?.email) {
      const prefs = await userRepository.getNotificationPreferences(recipient.id);
      if (prefs?.emailNotifyBookings) {
        await sendEmail({
          to: recipient.email,
          subject: `Alternative times suggested - Fitnassist`,
          html: emailTemplates.bookingSuggestion({
            recipientName: recipient.name ?? 'there',
            suggestorName,
            originalDate: formatDate(booking.date),
            originalStartTime: booking.startTime,
            suggestions: booking.suggestions.map((s) => ({
              date: formatDate(s.date),
              startTime: s.startTime,
              endTime: s.endTime,
            })),
          }),
        });
      }

      if (prefs?.smsNotifyBookings && prefs.phoneNumber) {
        await sendSms({
          to: prefs.phoneNumber,
          body: `Fitnassist: ${suggestorName} suggested alternative times for your session. Check your dashboard to review.`,
        });
      }
    }
  },

  /**
   * Send hold expired notification to both parties.
   */
  async sendBookingHoldExpired(bookingId: string) {
    const result = await getBookingWithParties(bookingId);
    if (!result) return;
    const { booking, trainerUser, clientUser, trainerName, clientName } = result;

    const dateStr = formatDate(booking.date);
    const baseData = {
      date: dateStr,
      startTime: booking.startTime,
      endTime: booking.endTime,
    };

    if (trainerUser?.email) {
      const prefs = await userRepository.getNotificationPreferences(trainerUser.id);
      if (prefs?.emailNotifyBookings) {
        await sendEmail({
          to: trainerUser.email,
          subject: `Session request expired - Fitnassist`,
          html: emailTemplates.bookingHoldExpired({
            ...baseData,
            recipientName: trainerUser.name ?? trainerName,
          }),
        });
      }
    }

    if (clientUser?.email) {
      const prefs = await userRepository.getNotificationPreferences(clientUser.id);
      if (prefs?.emailNotifyBookings) {
        await sendEmail({
          to: clientUser.email,
          subject: `Session request expired - Fitnassist`,
          html: emailTemplates.bookingHoldExpired({
            ...baseData,
            recipientName: clientName,
          }),
        });
      }
    }
  },

  /**
   * Send payment received notification to both parties.
   */
  async sendPaymentReceived(bookingId: string) {
    const result = await getBookingWithParties(bookingId);
    if (!result) return;
    const { booking, trainerUser, clientUser, trainerName, clientName } = result;

    const payment = await prisma.sessionPayment.findUnique({
      where: { bookingId },
      select: { amount: true, currency: true },
    });
    if (!payment) return;

    const dateStr = formatDate(booking.date);
    const amount = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: payment.currency.toUpperCase(),
    }).format(payment.amount / 100);

    const baseData = {
      amount,
      date: dateStr,
      startTime: booking.startTime,
      endTime: booking.endTime,
      bookingId: booking.id,
    };

    if (clientUser?.email) {
      const prefs = await userRepository.getNotificationPreferences(clientUser.id);
      if (prefs?.emailNotifyBookings) {
        await sendEmail({
          to: clientUser.email,
          subject: `Payment received — ${amount} - Fitnassist`,
          html: emailTemplates.paymentReceived({
            ...baseData,
            recipientName: clientName,
            otherPartyName: trainerName,
            isTrainer: false,
          }),
        });
      }
    }

    if (trainerUser?.email) {
      const prefs = await userRepository.getNotificationPreferences(trainerUser.id);
      if (prefs?.emailNotifyBookings) {
        await sendEmail({
          to: trainerUser.email,
          subject: `Payment received from ${clientName} — ${amount} - Fitnassist`,
          html: emailTemplates.paymentReceived({
            ...baseData,
            recipientName: trainerUser.name ?? trainerName,
            otherPartyName: clientName,
            isTrainer: true,
          }),
        });
      }
    }

    // In-app notifications
    if (trainerUser?.id) {
      inAppNotificationService.notify({
        userId: trainerUser.id,
        type: 'PAYMENT_RECEIVED',
        title: `Payment of ${amount} received from ${clientName}`,
        link: `/dashboard/bookings/${booking.id}`,
      }).catch(console.error);
    }
    if (clientUser?.id) {
      inAppNotificationService.notify({
        userId: clientUser.id,
        type: 'PAYMENT_RECEIVED',
        title: `Payment of ${amount} confirmed for session with ${trainerName}`,
        link: `/dashboard/bookings/${booking.id}`,
      }).catch(console.error);
    }
  },

  /**
   * Send refund processed notification to the client.
   */
  async sendRefundProcessed(bookingId: string, refundAmount: number, currency: string) {
    const result = await getBookingWithParties(bookingId);
    if (!result) return;
    const { booking, clientUser, clientName, trainerName } = result;

    const dateStr = formatDate(booking.date);
    const amount = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(refundAmount / 100);

    const payment = await prisma.sessionPayment.findUnique({
      where: { bookingId },
      select: { refundReason: true },
    });

    if (clientUser?.email) {
      const prefs = await userRepository.getNotificationPreferences(clientUser.id);
      if (prefs?.emailNotifyBookings) {
        await sendEmail({
          to: clientUser.email,
          subject: `Refund of ${amount} processed - Fitnassist`,
          html: emailTemplates.refundProcessed({
            recipientName: clientName,
            amount,
            date: dateStr,
            startTime: booking.startTime,
            reason: payment?.refundReason ?? undefined,
          }),
        });
      }
    }

    if (clientUser?.id) {
      inAppNotificationService.notify({
        userId: clientUser.id,
        type: 'REFUND_PROCESSED',
        title: `Refund of ${amount} processed for session with ${trainerName}`,
        link: `/dashboard/bookings/${booking.id}`,
      }).catch(console.error);
    }
  },

  /**
   * Send payment failed notification to the client.
   */
  async sendPaymentFailed(bookingId: string) {
    const result = await getBookingWithParties(bookingId);
    if (!result) return;
    const { booking, clientUser, clientName, trainerName } = result;

    const dateStr = formatDate(booking.date);

    if (clientUser?.email) {
      const prefs = await userRepository.getNotificationPreferences(clientUser.id);
      if (prefs?.emailNotifyBookings) {
        await sendEmail({
          to: clientUser.email,
          subject: `Payment failed for session with ${trainerName} - Fitnassist`,
          html: emailTemplates.paymentFailed({
            recipientName: clientName,
            otherPartyName: trainerName,
            date: dateStr,
            startTime: booking.startTime,
            bookingId: booking.id,
          }),
        });
      }
    }

    if (clientUser?.id) {
      inAppNotificationService.notify({
        userId: clientUser.id,
        type: 'PAYMENT_FAILED',
        title: `Payment failed for session with ${trainerName}`,
        link: `/dashboard/bookings/${booking.id}`,
      }).catch(console.error);
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
    const skipped = 0;

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
        sessionType: booking.sessionType,
        bookingId: booking.id,
      };

      if (trainerUser?.email) {
        const trainerPrefs = await userRepository.getNotificationPreferences(trainerUser.id);
        if (trainerPrefs?.emailNotifyBookingReminders) {
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

        if (trainerPrefs?.smsNotifyBookingReminders && trainerPrefs.phoneNumber) {
          await sendSms({
            to: trainerPrefs.phoneNumber,
            body: `Fitnassist: Reminder — session with ${clientName} tomorrow at ${booking.startTime}.`,
          });
        }
      }

      if (clientUser?.email) {
        const clientPrefs = await userRepository.getNotificationPreferences(clientUser.id);
        if (clientPrefs?.emailNotifyBookingReminders) {
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

        if (clientPrefs?.smsNotifyBookingReminders && clientPrefs.phoneNumber) {
          await sendSms({
            to: clientPrefs.phoneNumber,
            body: `Fitnassist: Reminder — session with ${trainerName} tomorrow at ${booking.startTime}.`,
          });
        }
      }

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

      await bookingRepository.markReminderSent(booking.id);
      sent++;
    }

    console.log(`[BookingReminders] Sent ${sent} reminders, skipped ${skipped}`);
    return { sent, skipped };
  },
};
