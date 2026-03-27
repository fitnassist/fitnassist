import { prisma } from '../lib/prisma';
import type { BookingStatus, Prisma } from '@fitnassist/database';

const SLOT_BLOCKING_STATUSES: BookingStatus[] = ['CONFIRMED', 'PENDING'];

const bookingInclude = {
  location: true,
  trainer: {
    select: { id: true, displayName: true, userId: true },
  },
  clientRoster: {
    include: {
      connection: {
        include: {
          sender: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  },
  suggestions: {
    orderBy: { createdAt: 'desc' as const },
  },
} satisfies Prisma.BookingInclude;

export const bookingRepository = {
  findById: (id: string) => {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        ...bookingInclude,
        rescheduledFrom: {
          select: { id: true, date: true, startTime: true, endTime: true },
        },
        rescheduledTo: {
          select: { id: true, date: true, startTime: true, endTime: true },
        },
      },
    });
  },

  findByTrainerAndDate: (trainerId: string, date: Date) => {
    return prisma.booking.findMany({
      where: {
        trainerId,
        date,
        status: { in: SLOT_BLOCKING_STATUSES },
      },
      include: {
        location: true,
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
      orderBy: { startTime: 'asc' },
    });
  },

  /**
   * Lightweight query for slot conflict checking — only returns date/time fields.
   */
  findSlotsByTrainerDateRange: (trainerId: string, startDate: Date, endDate: Date) => {
    return prisma.booking.findMany({
      where: {
        trainerId,
        date: { gte: startDate, lte: endDate },
        status: { in: SLOT_BLOCKING_STATUSES },
      },
      select: { date: true, startTime: true, endTime: true },
    });
  },

  findByTrainerDateRange: (trainerId: string, startDate: Date, endDate: Date, status?: BookingStatus) => {
    return prisma.booking.findMany({
      where: {
        trainerId,
        date: { gte: startDate, lte: endDate },
        ...(status ? { status } : { status: { notIn: ['DECLINED', 'CANCELLED_BY_TRAINER', 'CANCELLED_BY_CLIENT', 'RESCHEDULED'] } }),
      },
      include: bookingInclude,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  },

  findByClientRosterId: (clientRosterId: string) => {
    return prisma.booking.findMany({
      where: { clientRosterId },
      include: {
        location: true,
        trainer: {
          select: { id: true, displayName: true, profileImageUrl: true, userId: true },
        },
        suggestions: {
          orderBy: { createdAt: 'desc' as const },
        },
      },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    });
  },

  findUpcomingByUserId: (userId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.booking.findMany({
      where: {
        date: { gte: today },
        status: { in: SLOT_BLOCKING_STATUSES },
        OR: [
          { trainer: { userId } },
          { clientRoster: { connection: { senderId: userId } } },
        ],
      },
      include: {
        ...bookingInclude,
        rescheduledFrom: {
          select: { id: true, date: true, startTime: true, endTime: true },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  },

  create: (data: Prisma.BookingUncheckedCreateInput) => {
    return prisma.booking.create({
      data,
      include: bookingInclude,
    });
  },

  update: (id: string, data: Prisma.BookingUncheckedUpdateInput) => {
    return prisma.booking.update({
      where: { id },
      data,
      include: bookingInclude,
    });
  },

  /**
   * Creates a booking inside a transaction, re-checking availability
   * to prevent double-booking. PENDING bookings also block slots.
   */
  createWithLock: async (
    trainerId: string,
    date: Date,
    startTime: string,
    endTime: string,
    createData: Prisma.BookingUncheckedCreateInput
  ) => {
    return prisma.$transaction(async (tx) => {
      // Re-check for conflicting bookings within transaction
      const conflicts = await tx.booking.findMany({
        where: {
          trainerId,
          date,
          status: { in: SLOT_BLOCKING_STATUSES },
          OR: [
            { startTime: { lt: endTime }, endTime: { gt: startTime } },
          ],
        },
      });

      if (conflicts.length > 0) {
        throw new Error('SLOT_UNAVAILABLE');
      }

      return tx.booking.create({
        data: createData,
        include: bookingInclude,
      });
    });
  },

  findRemindable: (date: Date) => {
    return prisma.booking.findMany({
      where: {
        date,
        status: 'CONFIRMED',
        reminderSentAt: null,
      },
      include: {
        trainer: {
          select: {
            id: true,
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
  },

  markReminderSent: (id: string) => {
    return prisma.booking.update({
      where: { id },
      data: { reminderSentAt: new Date() },
    });
  },

  /**
   * Count PENDING bookings where the given user is the confirming party (not the initiator).
   */
  countPendingForUser: (userId: string) => {
    return prisma.booking.count({
      where: {
        status: 'PENDING',
        initiatedBy: { not: userId },
        OR: [
          { trainer: { userId } },
          { clientRoster: { connection: { senderId: userId } } },
        ],
      },
    });
  },

  /**
   * Find PENDING bookings whose hold has expired.
   */
  findExpiredPending: () => {
    return prisma.booking.findMany({
      where: {
        status: 'PENDING',
        holdExpiresAt: { lt: new Date() },
      },
      include: bookingInclude,
    });
  },

  /**
   * Find bookings with Daily rooms whose session time has passed.
   */
  findExpiredVideoRooms: () => {
    return prisma.booking.findMany({
      where: {
        dailyRoomName: { not: null },
        date: { lt: new Date() },
      },
      select: {
        id: true,
        dailyRoomName: true,
        date: true,
        endTime: true,
      },
    });
  },
};
