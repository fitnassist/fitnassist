import { TRPCError } from '@trpc/server';
import type { BookingStatus } from '@fitnassist/database';
import { bookingRepository } from '../repositories/booking.repository';
import { clientRosterRepository } from '../repositories/client-roster.repository';
import { availabilityService } from './availability.service';
import { bookingNotificationService } from './booking-notification.service';
import { inAppNotificationService } from './in-app-notification.service';
import { sseManager } from '../lib/sse';

export const bookingService = {
  getById: async (id: string, userId: string) => {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
    }

    // Check authorization — trainer or client
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
   * Create a booking with double-booking prevention.
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

    // Calculate end time
    const parts = data.startTime.split(':').map(Number);
    const startMinutes = (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
    const endMinutes = startMinutes + data.durationMin;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

    // Verify the slot is still available
    const slots = await availabilityService.getAvailableSlots(data.trainerId, data.date, data.durationMin);
    const slotAvailable = slots.some((s) => s.startTime === data.startTime);

    if (!slotAvailable) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'This time slot is no longer available',
      });
    }

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
          status: 'CONFIRMED',
        }
      );

      // Broadcast SSE events to both parties
      const trainerUserId = booking.trainer.userId;
      const clientUserId = booking.clientRoster.connection.senderId;

      const sseEvent = {
        type: 'booking_created' as const,
        bookingId: booking.id,
        date: data.date,
        startTime: data.startTime,
      };

      if (trainerUserId) {
        sseManager.broadcastToUser(trainerUserId, 'message', sseEvent);
      }
      if (clientUserId) {
        sseManager.broadcastToUser(clientUserId, 'message', sseEvent);
      }

      // Send confirmation emails (fire and forget)
      bookingNotificationService.sendBookingConfirmation(booking.id).catch((err) => {
        console.error('[BookingNotification] Failed to send confirmation:', err);
      });

      // In-app notifications (fire and forget)
      const clientName = booking.clientRoster.connection.sender?.name ?? 'Client';
      const dateLabel = new Date(data.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      if (trainerUserId) {
        inAppNotificationService.notify({
          userId: trainerUserId,
          type: 'BOOKING_CREATED',
          title: `New session booked with ${clientName} — ${dateLabel} at ${data.startTime}`,
          link: '/dashboard/bookings',
        }).catch(console.error);
      }
      if (clientUserId) {
        inAppNotificationService.notify({
          userId: clientUserId,
          type: 'BOOKING_CREATED',
          title: `Session booked — ${dateLabel} at ${data.startTime}`,
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
   * Cancel a booking.
   */
  cancel: async (id: string, userId: string, reason?: string) => {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
    }

    if (booking.status !== 'CONFIRMED') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only confirmed bookings can be cancelled' });
    }

    const isTrainer = booking.trainer.userId === userId;
    const isClient = booking.clientRoster.connection.senderId === userId;

    if (!isTrainer && !isClient) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to cancel this booking' });
    }

    const status: BookingStatus = isTrainer ? 'CANCELLED_BY_TRAINER' : 'CANCELLED_BY_CLIENT';

    const updated = await bookingRepository.update(id, {
      status,
      cancellationReason: reason,
      cancelledAt: new Date(),
    });

    // Broadcast SSE events to both parties
    const trainerUserId = booking.trainer.userId;
    const clientUserId = booking.clientRoster.connection.senderId;

    const sseEvent = {
      type: 'booking_cancelled' as const,
      bookingId: id,
      cancelledBy: isTrainer ? 'trainer' : 'client',
      reason,
    };

    if (trainerUserId) {
      sseManager.broadcastToUser(trainerUserId, 'message', sseEvent);
    }
    if (clientUserId) {
      sseManager.broadcastToUser(clientUserId, 'message', sseEvent);
    }

    // Send cancellation emails (fire and forget)
    bookingNotificationService.sendBookingCancellation(id, userId, reason).catch((err) => {
      console.error('[BookingNotification] Failed to send cancellation:', err);
    });

    // In-app notification to the other party (fire and forget)
    const cancellerName = isTrainer
      ? (booking.trainer.displayName ?? 'Trainer')
      : (booking.clientRoster.connection.sender?.name ?? 'Client');
    const recipientUserId = isTrainer ? clientUserId : trainerUserId;
    const dateLabel = new Date(booking.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
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

    // In-app notification to client (fire and forget)
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
};
