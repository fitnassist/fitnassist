import { prisma } from '../lib/prisma';
import type { BookingSuggestionStatus } from '@fitnassist/database';

export const bookingSuggestionRepository = {
  create: (data: {
    bookingId: string;
    suggestedBy: string;
    date: Date;
    startTime: string;
    endTime: string;
  }) => {
    return prisma.bookingSuggestion.create({
      data,
      include: {
        suggestor: { select: { id: true, name: true } },
      },
    });
  },

  createMany: (suggestions: {
    bookingId: string;
    suggestedBy: string;
    date: Date;
    startTime: string;
    endTime: string;
  }[]) => {
    return prisma.$transaction(
      suggestions.map((s) =>
        prisma.bookingSuggestion.create({
          data: s,
          include: {
            suggestor: { select: { id: true, name: true } },
          },
        })
      )
    );
  },

  findByBookingId: (bookingId: string) => {
    return prisma.bookingSuggestion.findMany({
      where: { bookingId },
      include: {
        suggestor: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  findById: (id: string) => {
    return prisma.bookingSuggestion.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            trainer: { select: { id: true, displayName: true, userId: true } },
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
        },
        suggestor: { select: { id: true, name: true } },
      },
    });
  },

  updateStatus: (id: string, status: BookingSuggestionStatus) => {
    return prisma.bookingSuggestion.update({
      where: { id },
      data: { status },
    });
  },

  declineAllForBooking: (bookingId: string, exceptId?: string) => {
    return prisma.bookingSuggestion.updateMany({
      where: {
        bookingId,
        status: 'PENDING',
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      data: { status: 'DECLINED' },
    });
  },
};
