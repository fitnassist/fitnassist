import { TRPCError } from '@trpc/server';
import type { DayOfWeek } from '@fitnassist/database';
import { availabilityRepository } from '../repositories/availability.repository';
import { bookingRepository } from '../repositories/booking.repository';
import { prisma } from '../lib/prisma';

const DAY_MAP: Record<number, DayOfWeek> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

const timeToMinutes = (time: string): number => {
  const parts = time.split(':').map(Number);
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
};

const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export interface AvailableSlot {
  startTime: string;
  endTime: string;
  durationMin: number;
}

export const availabilityService = {
  getByTrainerId: (trainerId: string) => {
    return availabilityRepository.findByTrainerId(trainerId);
  },

  replaceAll: (trainerId: string, slots: {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    sessionDurationMin: number;
  }[]) => {
    return availabilityRepository.replaceAll(trainerId, slots);
  },

  getOverrides: (trainerId: string, startDate: Date, endDate: Date) => {
    return availabilityRepository.findOverridesByTrainerAndDateRange(trainerId, startDate, endDate);
  },

  createOverride: (trainerId: string, data: {
    date: Date;
    isBlocked?: boolean;
    startTime?: string;
    endTime?: string;
    reason?: string;
  }) => {
    return availabilityRepository.createOverride({ ...data, trainerId });
  },

  deleteOverride: async (trainerId: string, id: string) => {
    const override = await prisma.availabilityOverride.findUnique({ where: { id } });
    if (!override || override.trainerId !== trainerId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Override not found' });
    }
    return availabilityRepository.deleteOverride(id);
  },

  /**
   * Get available slots for a trainer on a given date.
   */
  getAvailableSlots: async (
    trainerId: string,
    date: Date,
    requestedDurationMin?: number
  ): Promise<AvailableSlot[]> => {
    const dayOfWeek = DAY_MAP[date.getDay()];
    if (!dayOfWeek) return [];

    // Check for date override
    const override = await availabilityRepository.findOverrideByTrainerAndDate(trainerId, date);
    if (override?.isBlocked) return [];

    // Get availability windows
    let windows: { startTime: string; endTime: string; sessionDurationMin: number }[];

    if (override && !override.isBlocked && override.startTime && override.endTime) {
      windows = [{
        startTime: override.startTime,
        endTime: override.endTime,
        sessionDurationMin: requestedDurationMin ?? 60,
      }];
    } else {
      const availability = await availabilityRepository.findByTrainerAndDay(trainerId, dayOfWeek);
      if (availability.length === 0) return [];
      windows = availability;
    }

    // Get trainer travel settings
    const trainer = await prisma.trainerProfile.findUnique({
      where: { id: trainerId },
      select: { travelBufferMin: true },
    });

    const travelBufferMin = trainer?.travelBufferMin ?? 15;

    // Get existing bookings for the date
    const bookings = await bookingRepository.findByTrainerAndDate(trainerId, date);
    const bookedSlots = bookings.map((b) => ({
      start: timeToMinutes(b.startTime),
      end: timeToMinutes(b.endTime),
    }));

    bookedSlots.sort((a, b) => a.start - b.start);

    const availableSlots: AvailableSlot[] = [];

    for (const window of windows) {
      const windowStart = timeToMinutes(window.startTime);
      const windowEnd = timeToMinutes(window.endTime);
      const duration = requestedDurationMin ?? window.sessionDurationMin;

      for (let slotStart = windowStart; slotStart + duration <= windowEnd; slotStart += duration) {
        const slotEnd = slotStart + duration;

        let isAvailable = true;

        for (const booked of bookedSlots) {
          // Slot must not overlap with booking + travel buffer
          if (slotStart < booked.end + travelBufferMin && slotEnd > booked.start - travelBufferMin) {
            isAvailable = false;
            break;
          }
        }

        if (isAvailable) {
          availableSlots.push({
            startTime: minutesToTime(slotStart),
            endTime: minutesToTime(slotEnd),
            durationMin: duration,
          });
        }
      }
    }

    return availableSlots;
  },

  /**
   * Get dates in a range that have any availability.
   */
  getAvailableDates: async (
    trainerId: string,
    startDate: Date,
    endDate: Date,
    durationMin?: number
  ): Promise<string[]> => {
    const dates: string[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const slots = await availabilityService.getAvailableSlots(trainerId, new Date(current), durationMin);
      if (slots.length > 0) {
        const dateStr = current.toISOString().split('T')[0];
        if (dateStr) dates.push(dateStr);
      }
      current.setDate(current.getDate() + 1);
    }

    return dates;
  },
};
