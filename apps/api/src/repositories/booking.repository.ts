import { prisma } from '../lib/prisma';
import type { BookingStatus, Prisma } from '@fitnassist/database';

export const bookingRepository = {
  findById: (id: string) => {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        location: true,
        clientRoster: {
          include: {
            connection: {
              include: {
                sender: { select: { id: true, name: true, email: true, image: true } },
              },
            },
          },
        },
        trainer: {
          select: { id: true, displayName: true, userId: true },
        },
      },
    });
  },

  findByTrainerAndDate: (trainerId: string, date: Date) => {
    return prisma.booking.findMany({
      where: {
        trainerId,
        date,
        status: 'CONFIRMED',
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

  findByTrainerDateRange: (trainerId: string, startDate: Date, endDate: Date, status?: BookingStatus) => {
    return prisma.booking.findMany({
      where: {
        trainerId,
        date: { gte: startDate, lte: endDate },
        ...(status ? { status } : {}),
      },
      include: {
        location: true,
        clientRoster: {
          include: {
            connection: {
              include: {
                sender: { select: { id: true, name: true, email: true, image: true } },
              },
            },
          },
        },
      },
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
        status: 'CONFIRMED',
        OR: [
          { trainer: { userId } },
          { clientRoster: { connection: { senderId: userId } } },
        ],
      },
      include: {
        location: true,
        trainer: {
          select: { id: true, displayName: true, profileImageUrl: true, userId: true },
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
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  },

  create: (data: {
    trainerId: string;
    clientRosterId: string;
    locationId?: string;
    date: Date;
    startTime: string;
    endTime: string;
    durationMin: number;
    clientAddress?: string;
    clientPostcode?: string;
    clientLatitude?: number;
    clientLongitude?: number;
    notes?: string;
  }) => {
    return prisma.booking.create({
      data,
      include: {
        location: true,
        trainer: {
          select: { id: true, displayName: true, userId: true },
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
  },

  update: (id: string, data: {
    status?: BookingStatus;
    cancellationReason?: string;
    cancelledAt?: Date;
    reminderSentAt?: Date;
    notes?: string;
  }) => {
    return prisma.booking.update({ where: { id }, data });
  },

  /**
   * Creates a booking inside a transaction, re-checking availability
   * to prevent double-booking.
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
          status: 'CONFIRMED',
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
        include: {
          location: true,
          trainer: {
            select: { id: true, displayName: true, userId: true },
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
};
