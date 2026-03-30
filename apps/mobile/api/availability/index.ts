import { trpc } from '@/lib/trpc';

export const useAvailableSlots = (trainerId: string, date: string, durationMin?: number) => {
  return trpc.availability.getSlots.useQuery(
    { trainerId, date, durationMin },
    { enabled: !!trainerId && !!date },
  );
};

export const useAvailableDates = (trainerId: string, startDate: string, endDate: string, durationMin?: number) => {
  return trpc.availability.getDates.useQuery(
    { trainerId, startDate, endDate, durationMin },
    { enabled: !!trainerId && !!startDate && !!endDate },
  );
};
