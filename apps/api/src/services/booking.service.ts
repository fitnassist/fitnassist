import { TRPCError } from '@trpc/server';
import type { BookingStatus, SessionType } from '@fitnassist/database';
import { bookingRepository } from '../repositories/booking.repository';
import { bookingSuggestionRepository } from '../repositories/booking-suggestion.repository';
import { clientRosterRepository } from '../repositories/client-roster.repository';
import { availabilityService } from './availability.service';
import { bookingNotificationService } from './booking-notification.service';
import { inAppNotificationService } from './in-app-notification.service';
import { sseManager } from '../lib/sse';
import { dailyService, DailyConfigError } from '../lib/daily';
import { sessionPaymentService } from './session-payment.service';

const HOLD_DURATION_MS = 48 * 60 * 60 * 1000; // 48 hours

const calculateEndTime = (startTime: string, durationMin: number): string => {
  const parts = startTime.split(':').map(Number);
  const startMinutes = (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  const endMinutes = startMinutes + durationMin;
  return `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
};

const formatDateLabel = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const getBookingParties = (booking: {
  trainer: { userId: string; displayName: string };
  clientRoster: { connection: { sender?: { id: string; name: string } | null; senderId: string | null } };
  initiatedBy?: string | null;
}) => {
  const trainerUserId = booking.trainer.userId;
  const clientUserId = booking.clientRoster.connection.sender?.id ?? booking.clientRoster.connection.senderId ?? '';
  const trainerName = booking.trainer.displayName ?? 'Trainer';
  const clientName = booking.clientRoster.connection.sender?.name ?? 'Client';
  const initiatedBy = booking.initiatedBy;

  // The confirming party is whoever did NOT initiate the booking
  const confirmingUserId = initiatedBy === trainerUserId ? clientUserId : trainerUserId;

  return { trainerUserId, clientUserId, trainerName, clientName, initiatedBy, confirmingUserId };
};

export const bookingService = {
  getById: async (id: string, userId: string) => {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
    }

    const isTrainer = booking.trainer.userId === userId;
    const isClient = booking.clientRoster.connection.senderId === userId;
    if (!isTrainer && !isClient) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to view this booking' });
    }

    return booking;
  },

  getByTrainerDateRange: (trainerId: string, startDate: Date, endDate: Date, status?: BookingStatus) => {
    return bookingRepository.findByTrainerDateRange(trainerId, startDate, endDate, status);
  },

  getUpcomingByUserId: (userId: string) => {
    return bookingRepository.findUpcomingByUserId(userId);
  },

  getByClientRosterId: (clientRosterId: string) => {
    return bookingRepository.findByClientRosterId(clientRosterId);
  },

  /**
   * Create a booking. Status starts as PENDING — the other party must confirm.
   */
  create: async (data: {
    trainerId: string;
    clientRosterId: string;
    locationId?: string;
    date: Date;
    startTime: string;
    durationMin: number;
    clientAddress?: string;
    clientPostcode?: string;
    clientLatitude?: number;
    clientLongitude?: number;
    notes?: string;
    initiatedBy: string;
    sessionType?: SessionType;
    isFreeSession?: boolean;
  }) => {
    // Verify the client roster exists, belongs to this trainer, and is active
    const roster = await clientRosterRepository.findById(data.clientRosterId);
    if (!roster) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
    }
    if (roster.trainerId !== data.trainerId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Client is not in your roster' });
    }
    if (!['ACTIVE', 'ONBOARDING'].includes(roster.status)) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only active clients can book sessions' });
    }

    const endTime = calculateEndTime(data.startTime, data.durationMin);

    // Verify the slot is still available
    const slots = await availabilityService.getAvailableSlots(data.trainerId, data.date, data.durationMin);
    const slotAvailable = slots.some((s) => s.startTime === data.startTime);

    if (!slotAvailable) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'This time slot is no longer available',
      });
    }

    const holdExpiresAt = new Date(Date.now() + HOLD_DURATION_MS);

    // Create with transaction lock to prevent race conditions
    try {
      const booking = await bookingRepository.createWithLock(
        data.trainerId,
        data.date,
        data.startTime,
        endTime,
        {
          ...data,
          endTime,
          status: 'PENDING',
          holdExpiresAt,
        }
      );

      const { trainerUserId, clientUserId, trainerName, clientName, confirmingUserId } = getBookingParties(booking);
      const dateLabel = formatDateLabel(data.date);

      // SSE to both parties
      const sseEvent = {
        type: 'booking_pending' as const,
        bookingId: booking.id,
        date: data.date,
        startTime: data.startTime,
      };

      if (trainerUserId) sseManager.broadcastToUser(trainerUserId, 'message', sseEvent);
      if (clientUserId) sseManager.broadcastToUser(clientUserId, 'message', sseEvent);

      // Email to the confirming party
      bookingNotificationService.sendBookingPending(booking.id).catch((err) => {
        console.error('[BookingNotification] Failed to send pending notification:', err);
      });

      // In-app notification to the confirming party
      if (confirmingUserId) {
        const requesterName = data.initiatedBy === trainerUserId ? trainerName : clientName;
        inAppNotificationService.notify({
          userId: confirmingUserId,
          type: 'BOOKING_PENDING',
          title: `${requesterName} requested a session — ${dateLabel} at ${data.startTime}`,
          link: '/dashboard/bookings',
        }).catch(console.error);
      }

      // In-app notification to the initiator
      const initiatorUserId = data.initiatedBy === trainerUserId ? trainerUserId : clientUserId;
      if (initiatorUserId) {
        inAppNotificationService.notify({
          userId: initiatorUserId,
          type: 'BOOKING_PENDING',
          title: `Session requested — ${dateLabel} at ${data.startTime}. Awaiting confirmation.`,
          link: '/dashboard/bookings',
        }).catch(console.error);
      }

      return booking;
    } catch (error) {
      if (error instanceof Error && error.message === 'SLOT_UNAVAILABLE') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This time slot was just booked by someone else',
        });
      }
      throw error;
    }
  },

  /**
   * Confirm a PENDING booking. Only the non-initiating party can confirm.
   */
  confirm: async (id: string, userId: string) => {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
    }

    if (booking.status !== 'PENDING') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only pending bookings can be confirmed' });
    }

    const { trainerUserId, clientUserId, trainerName, clientName, confirmingUserId } = getBookingParties(booking);

    if (userId !== confirmingUserId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not authorized to confirm this booking' });
    }

    // Create Daily.co room for video calls
    let dailyData: { dailyRoomUrl?: string; dailyRoomName?: string } = {};
    if (booking.sessionType === 'VIDEO_CALL') {
      try {
        const dateStr = booking.date instanceof Date
          ? booking.date.toISOString().split('T')[0]
          : new Date(booking.date).toISOString().split('T')[0];
        const sessionEnd = new Date(`${dateStr}T${booking.endTime}:00`);
        const room = await dailyService.createRoom(id, sessionEnd);
        dailyData = { dailyRoomUrl: room.url, dailyRoomName: room.name };
      } catch (err) {
        console.error('[Daily] Failed to create room for booking', id, err);
        // Config/billing errors are silently swallowed — the booking still confirms
        // but the video call won't be available. Real errors surface to the user.
        if (!(err instanceof DailyConfigError)) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Video call setup failed. The booking has not been confirmed. Please try again.',
          });
        }
      }
    }

    const updated = await bookingRepository.update(id, {
      status: 'CONFIRMED',
      holdExpiresAt: null,
      ...dailyData,
    });

    const dateLabel = formatDateLabel(booking.date);

    // SSE to both
    const sseEvent = { type: 'booking_confirmed' as const, bookingId: id };
    if (trainerUserId) sseManager.broadcastToUser(trainerUserId, 'message', sseEvent);
    if (clientUserId) sseManager.broadcastToUser(clientUserId, 'message', sseEvent);

    // Email confirmation to both
    bookingNotificationService.sendBookingConfirmation(id).catch((err) => {
      console.error('[BookingNotification] Failed to send confirmation:', err);
    });

    // In-app to the other party (who initiated)
    const otherUserId = userId === trainerUserId ? clientUserId : trainerUserId;
    const confirmerName = userId === trainerUserId ? trainerName : clientName;
    if (otherUserId) {
      inAppNotificationService.notify({
        userId: otherUserId,
        type: 'BOOKING_CONFIRMED',
        title: `${confirmerName} confirmed session — ${dateLabel} at ${booking.startTime}`,
        link: '/dashboard/bookings',
      }).catch(console.error);
    }

    return updated;
  },

  /**
   * Decline a PENDING booking. Only the non-initiating party can decline.
   */
  decline: async (id: string, userId: string, reason?: string) => {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
    }

    if (booking.status !== 'PENDING') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only pending bookings can be declined' });
    }

    const { trainerUserId, clientUserId, trainerName, clientName, confirmingUserId } = getBookingParties(booking);

    if (userId !== confirmingUserId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not authorized to decline this booking' });
    }

    const updated = await bookingRepository.update(id, {
      status: 'DECLINED',
      declineReason: reason,
      declinedAt: new Date(),
      holdExpiresAt: null,
    });

    // Process full refund if there was a payment
    sessionPaymentService.processDeclineRefund(id).catch((err) => {
      console.error('[SessionPayment] Failed to process decline refund:', err);
    });

    const dateLabel = formatDateLabel(booking.date);

    // SSE to both
    const sseEvent = { type: 'booking_declined' as const, bookingId: id, reason };
    if (trainerUserId) sseManager.broadcastToUser(trainerUserId, 'message', sseEvent);
    if (clientUserId) sseManager.broadcastToUser(clientUserId, 'message', sseEvent);

    // Email to the initiator
    bookingNotificationService.sendBookingDeclined(id).catch((err) => {
      console.error('[BookingNotification] Failed to send decline notification:', err);
    });

    // In-app to the initiator
    const otherUserId = userId === trainerUserId ? clientUserId : trainerUserId;
    const declinerName = userId === trainerUserId ? trainerName : clientName;
    if (otherUserId) {
      inAppNotificationService.notify({
        userId: otherUserId,
        type: 'BOOKING_DECLINED',
        title: `${declinerName} declined session on ${dateLabel}${reason ? ` — ${reason}` : ''}`,
        link: '/dashboard/bookings',
      }).catch(console.error);
    }

    return updated;
  },

  /**
   * Cancel a booking (CONFIRMED or PENDING).
   */
  cancel: async (id: string, userId: string, reason?: string) => {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
    }

    if (!['CONFIRMED', 'PENDING'].includes(booking.status)) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only confirmed or pending bookings can be cancelled' });
    }

    const isTrainer = booking.trainer.userId === userId;
    const isClient = booking.clientRoster.connection.senderId === userId;

    if (!isTrainer && !isClient) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to cancel this booking' });
    }

    const status: BookingStatus = isTrainer ? 'CANCELLED_BY_TRAINER' : 'CANCELLED_BY_CLIENT';

    // Delete Daily.co room if this was a video call
    if (booking.dailyRoomName) {
      dailyService.deleteRoom(booking.dailyRoomName).catch((err) => {
        console.error('[Daily] Failed to delete room on cancel:', err);
      });
    }

    const updated = await bookingRepository.update(id, {
      status,
      cancellationReason: reason,
      cancelledAt: new Date(),
      holdExpiresAt: null,
      dailyRoomUrl: null,
      dailyRoomName: null,
    });

    // Process refund based on cancellation policy
    sessionPaymentService.processCancellationRefund(id, isTrainer ? 'trainer' : 'client').catch((err) => {
      console.error('[SessionPayment] Failed to process cancellation refund:', err);
    });

    const trainerUserId = booking.trainer.userId;
    const clientUserId = booking.clientRoster.connection.senderId;

    // SSE to both
    const sseEvent = {
      type: 'booking_cancelled' as const,
      bookingId: id,
      cancelledBy: isTrainer ? 'trainer' : 'client',
      reason,
    };

    if (trainerUserId) sseManager.broadcastToUser(trainerUserId, 'message', sseEvent);
    if (clientUserId) sseManager.broadcastToUser(clientUserId, 'message', sseEvent);

    // Email to the other party
    bookingNotificationService.sendBookingCancellation(id, userId, reason).catch((err) => {
      console.error('[BookingNotification] Failed to send cancellation:', err);
    });

    // In-app notification to the other party
    const cancellerName = isTrainer
      ? (booking.trainer.displayName ?? 'Trainer')
      : (booking.clientRoster.connection.sender?.name ?? 'Client');
    const recipientUserId = isTrainer ? clientUserId : trainerUserId;
    const dateLabel = formatDateLabel(booking.date);
    if (recipientUserId) {
      inAppNotificationService.notify({
        userId: recipientUserId,
        type: 'BOOKING_CANCELLED',
        title: `${cancellerName} cancelled session on ${dateLabel}`,
        link: '/dashboard/bookings',
      }).catch(console.error);
    }

    return updated;
  },

  /**
   * Reschedule a booking — marks original as RESCHEDULED, creates new PENDING booking.
   */
  reschedule: async (
    id: string,
    userId: string,
    newDate: Date,
    newStartTime: string,
    newDurationMin: number
  ) => {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
    }

    if (!['CONFIRMED', 'PENDING'].includes(booking.status)) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only confirmed or pending bookings can be rescheduled' });
    }

    const isTrainer = booking.trainer.userId === userId;
    const isClient = booking.clientRoster.connection.senderId === userId;
    if (!isTrainer && !isClient) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to reschedule this booking' });
    }

    const newEndTime = calculateEndTime(newStartTime, newDurationMin);

    // Verify new slot is available
    const slots = await availabilityService.getAvailableSlots(booking.trainerId, newDate, newDurationMin);
    const slotAvailable = slots.some((s) => s.startTime === newStartTime);
    if (!slotAvailable) {
      throw new TRPCError({ code: 'CONFLICT', message: 'The new time slot is not available' });
    }

    // Mark original as rescheduled
    await bookingRepository.update(id, {
      status: 'RESCHEDULED',
      holdExpiresAt: null,
    });

    const holdExpiresAt = new Date(Date.now() + HOLD_DURATION_MS);

    // Delete old Daily room if video call
    if (booking.dailyRoomName) {
      dailyService.deleteRoom(booking.dailyRoomName).catch((err) => {
        console.error('[Daily] Failed to delete room on reschedule:', err);
      });
    }

    // Create new booking as PENDING
    const newBooking = await bookingRepository.createWithLock(
      booking.trainerId,
      newDate,
      newStartTime,
      newEndTime,
      {
        trainerId: booking.trainerId,
        clientRosterId: booking.clientRosterId,
        locationId: booking.locationId,
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        durationMin: newDurationMin,
        sessionType: booking.sessionType,
        clientAddress: booking.clientAddress,
        clientPostcode: booking.clientPostcode,
        clientLatitude: booking.clientLatitude,
        clientLongitude: booking.clientLongitude,
        notes: booking.notes,
        status: 'PENDING',
        initiatedBy: userId,
        holdExpiresAt,
        rescheduledFromId: id,
      }
    );

    const { trainerUserId, clientUserId, trainerName, clientName } = getBookingParties(booking);
    const dateLabel = formatDateLabel(newDate);
    const reschedulerName = isTrainer ? trainerName : clientName;

    // SSE to both
    const sseEvent = {
      type: 'booking_rescheduled' as const,
      bookingId: id,
      newBookingId: newBooking.id,
    };
    if (trainerUserId) sseManager.broadcastToUser(trainerUserId, 'message', sseEvent);
    if (clientUserId) sseManager.broadcastToUser(clientUserId, 'message', sseEvent);

    // Email
    bookingNotificationService.sendBookingRescheduled(newBooking.id, id).catch((err) => {
      console.error('[BookingNotification] Failed to send reschedule notification:', err);
    });

    // In-app to the other party
    const recipientUserId = isTrainer ? clientUserId : trainerUserId;
    if (recipientUserId) {
      inAppNotificationService.notify({
        userId: recipientUserId,
        type: 'BOOKING_RESCHEDULED',
        title: `${reschedulerName} rescheduled session to ${dateLabel} at ${newStartTime}`,
        link: '/dashboard/bookings',
      }).catch(console.error);
    }

    return newBooking;
  },

  /**
   * Suggest alternative times for a PENDING booking.
   */
  suggestAlternative: async (
    bookingId: string,
    userId: string,
    suggestions: { date: string; startTime: string; endTime: string }[]
  ) => {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
    }

    if (booking.status !== 'PENDING') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Can only suggest alternatives for pending bookings' });
    }

    const { confirmingUserId } = getBookingParties(booking);
    if (userId !== confirmingUserId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the confirming party can suggest alternatives' });
    }

    // Validate each suggestion against trainer availability
    for (const s of suggestions) {
      const slots = await availabilityService.getAvailableSlots(booking.trainerId, new Date(s.date));
      const valid = slots.some((slot) => slot.startTime === s.startTime);
      if (!valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Slot ${s.startTime} on ${s.date} is not available`,
        });
      }
    }

    const created = await bookingSuggestionRepository.createMany(
      suggestions.map((s) => ({
        bookingId,
        suggestedBy: userId,
        date: new Date(s.date),
        startTime: s.startTime,
        endTime: s.endTime,
      }))
    );

    const { trainerUserId, clientUserId, trainerName, clientName } = getBookingParties(booking);
    const suggestorName = userId === trainerUserId ? trainerName : clientName;
    const recipientUserId = userId === trainerUserId ? clientUserId : trainerUserId;

    // SSE
    const sseEvent = { type: 'booking_suggestion' as const, bookingId };
    if (recipientUserId) sseManager.broadcastToUser(recipientUserId, 'message', sseEvent);

    // Email
    bookingNotificationService.sendBookingSuggestion(bookingId).catch((err) => {
      console.error('[BookingNotification] Failed to send suggestion notification:', err);
    });

    // In-app
    if (recipientUserId) {
      inAppNotificationService.notify({
        userId: recipientUserId,
        type: 'BOOKING_SUGGESTION',
        title: `${suggestorName} suggested alternative times for your session`,
        link: '/dashboard/bookings',
      }).catch(console.error);
    }

    return created;
  },

  /**
   * Respond to a suggestion — accept or decline.
   */
  respondToSuggestion: async (suggestionId: string, userId: string, accept: boolean) => {
    const suggestion = await bookingSuggestionRepository.findById(suggestionId);
    if (!suggestion) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Suggestion not found' });
    }

    const booking = suggestion.booking;
    if (booking.status !== 'PENDING') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Booking is no longer pending' });
    }

    // Only the initiator (who the suggestion was sent to) can respond
    const isTrainer = booking.trainer.userId === userId;
    const isClient = booking.clientRoster.connection.senderId === userId;
    if (!isTrainer && !isClient) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
    }

    // The responder should be the one who did NOT suggest
    if (suggestion.suggestedBy === userId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot respond to your own suggestion' });
    }

    if (accept) {
      // Calculate end time from suggestion
      const durationParts = suggestion.endTime.split(':').map(Number);
      const startParts = suggestion.startTime.split(':').map(Number);
      const durationMin = ((durationParts[0] ?? 0) * 60 + (durationParts[1] ?? 0)) -
                          ((startParts[0] ?? 0) * 60 + (startParts[1] ?? 0));

      // Create Daily.co room for video calls
      let dailyData: { dailyRoomUrl?: string; dailyRoomName?: string } = {};
      if (booking.sessionType === 'VIDEO_CALL') {
        try {
          const dateStr = suggestion.date instanceof Date
            ? suggestion.date.toISOString().split('T')[0]
            : new Date(suggestion.date).toISOString().split('T')[0];
          const sessionEnd = new Date(`${dateStr}T${suggestion.endTime}:00`);
          const room = await dailyService.createRoom(booking.id, sessionEnd);
          dailyData = { dailyRoomUrl: room.url, dailyRoomName: room.name };
        } catch (err) {
          console.error('[Daily] Failed to create room for suggestion accept', booking.id, err);
          if (!(err instanceof DailyConfigError)) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Video call setup failed. Please try again.',
            });
          }
        }
      }

      // Update the booking with the suggested time and confirm it
      await bookingRepository.update(booking.id, {
        date: suggestion.date,
        startTime: suggestion.startTime,
        endTime: suggestion.endTime,
        durationMin: durationMin > 0 ? durationMin : undefined,
        status: 'CONFIRMED',
        holdExpiresAt: null,
        ...dailyData,
      });

      // Accept this suggestion, decline all others
      await bookingSuggestionRepository.updateStatus(suggestionId, 'ACCEPTED');
      await bookingSuggestionRepository.declineAllForBooking(booking.id, suggestionId);

      const trainerUserId = booking.trainer.userId;
      const clientUserId = booking.clientRoster.connection.senderId;
      const dateLabel = formatDateLabel(suggestion.date);

      // SSE + email
      const sseEvent = { type: 'booking_confirmed' as const, bookingId: booking.id };
      if (trainerUserId) sseManager.broadcastToUser(trainerUserId, 'message', sseEvent);
      if (clientUserId) sseManager.broadcastToUser(clientUserId, 'message', sseEvent);

      bookingNotificationService.sendBookingConfirmation(booking.id).catch(console.error);

      // In-app to the suggestor
      if (suggestion.suggestedBy) {
        inAppNotificationService.notify({
          userId: suggestion.suggestedBy,
          type: 'BOOKING_CONFIRMED',
          title: `Your suggested time was accepted — ${dateLabel} at ${suggestion.startTime}`,
          link: '/dashboard/bookings',
        }).catch(console.error);
      }

      return { accepted: true, bookingId: booking.id };
    } else {
      await bookingSuggestionRepository.updateStatus(suggestionId, 'DECLINED');

      // In-app to the suggestor
      if (suggestion.suggestedBy) {
        inAppNotificationService.notify({
          userId: suggestion.suggestedBy,
          type: 'BOOKING_DECLINED',
          title: 'Your suggested time was declined',
          link: '/dashboard/bookings',
        }).catch(console.error);
      }

      return { accepted: false, suggestionId };
    }
  },

  /**
   * Get suggestions for a booking.
   */
  getSuggestions: async (bookingId: string, userId: string) => {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
    }

    const isTrainer = booking.trainer.userId === userId;
    const isClient = booking.clientRoster.connection.senderId === userId;
    if (!isTrainer && !isClient) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
    }

    return bookingSuggestionRepository.findByBookingId(bookingId);
  },

  /**
   * Mark a booking as completed (trainer only).
   */
  complete: async (id: string, trainerId: string) => {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
    }

    if (booking.trainerId !== trainerId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
    }

    if (booking.status !== 'CONFIRMED') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only confirmed bookings can be completed' });
    }

    const result = await bookingRepository.update(id, { status: 'COMPLETED' });

    const clientUserId = booking.clientRoster.connection.senderId;
    if (clientUserId) {
      inAppNotificationService.notify({
        userId: clientUserId,
        type: 'BOOKING_COMPLETED',
        title: 'Session marked complete',
        link: '/dashboard/bookings',
      }).catch(console.error);
    }

    return result;
  },

  /**
   * Mark a booking as no-show (trainer only).
   */
  markNoShow: async (id: string, trainerId: string) => {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
    }

    if (booking.trainerId !== trainerId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
    }

    return bookingRepository.update(id, { status: 'NO_SHOW' });
  },

  /**
   * Expire PENDING bookings whose hold has elapsed. Called by cron.
   */
  expirePendingBookings: async () => {
    const expired = await bookingRepository.findExpiredPending();
    let count = 0;

    for (const booking of expired) {
      await bookingRepository.update(booking.id, {
        status: 'DECLINED',
        declineReason: 'Expired — no response within 48 hours',
        declinedAt: new Date(),
        holdExpiresAt: null,
      });

      const trainerUserId = booking.trainer.userId;
      const clientUserId = booking.clientRoster.connection.senderId;
      const dateLabel = formatDateLabel(booking.date);

      // SSE to both
      const sseEvent = { type: 'booking_hold_expired' as const, bookingId: booking.id };
      if (trainerUserId) sseManager.broadcastToUser(trainerUserId, 'message', sseEvent);
      if (clientUserId) sseManager.broadcastToUser(clientUserId, 'message', sseEvent);

      // Email both
      bookingNotificationService.sendBookingHoldExpired(booking.id).catch(console.error);

      // In-app to both
      const title = `Session request for ${dateLabel} at ${booking.startTime} expired`;
      if (trainerUserId) {
        inAppNotificationService.notify({
          userId: trainerUserId,
          type: 'BOOKING_EXPIRED',
          title,
          link: '/dashboard/bookings',
        }).catch(console.error);
      }
      if (clientUserId) {
        inAppNotificationService.notify({
          userId: clientUserId,
          type: 'BOOKING_EXPIRED',
          title,
          link: '/dashboard/bookings',
        }).catch(console.error);
      }

      count++;
    }

    console.log(`[BookingHoldExpiry] Expired ${count} pending bookings`);
    return { expired: count };
  },

  /**
   * Count PENDING bookings awaiting confirmation by this user.
   */
  getPendingCountForUser: async (userId: string) => {
    const count = await bookingRepository.countPendingForUser(userId);
    return { count };
  },

  /**
   * Clean up expired Daily.co video rooms. Called by cron.
   * Deletes the room from Daily and clears the DB fields.
   */
  cleanupExpiredVideoRooms: async () => {
    const bookings = await bookingRepository.findExpiredVideoRooms();
    let cleaned = 0;

    for (const booking of bookings) {
      // Double-check the session has actually ended (date < today catches most,
      // but same-day bookings need the endTime check)
      const dateStr = booking.date instanceof Date
        ? booking.date.toISOString().split('T')[0]
        : new Date(booking.date).toISOString().split('T')[0];
      const sessionEnd = new Date(`${dateStr}T${booking.endTime}:00`);

      if (sessionEnd.getTime() >= Date.now()) continue;

      if (booking.dailyRoomName) {
        await dailyService.deleteRoom(booking.dailyRoomName).catch((err) => {
          console.error('[Daily] Failed to delete expired room:', booking.dailyRoomName, err);
        });
      }

      await bookingRepository.update(booking.id, {
        dailyRoomUrl: null,
        dailyRoomName: null,
      });

      cleaned++;
    }

    console.log(`[VideoRoomCleanup] Cleaned ${cleaned} expired video rooms`);
    return { cleaned };
  },
};
