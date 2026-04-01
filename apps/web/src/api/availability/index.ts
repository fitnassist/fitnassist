import { trpc } from '@/lib/trpc';

export const useWeeklyAvailability = () => {
  return trpc.availability.getWeekly.useQuery();
};

export const useSetWeeklyAvailability = () => {
  const utils = trpc.useUtils();
  return trpc.availability.setWeekly.useMutation({
    onSuccess: () => {
      utils.availability.getWeekly.invalidate();
    },
  });
};

export const useAvailabilityOverrides = (startDate: string, endDate: string) => {
  return trpc.availability.getOverrides.useQuery(
    { startDate, endDate },
    { enabled: !!startDate && !!endDate },
  );
};

export const useCreateOverride = () => {
  const utils = trpc.useUtils();
  return trpc.availability.createOverride.useMutation({
    onSuccess: () => {
      utils.availability.getOverrides.invalidate();
    },
  });
};

export const useDeleteOverride = () => {
  const utils = trpc.useUtils();
  return trpc.availability.deleteOverride.useMutation({
    onSuccess: () => {
      utils.availability.getOverrides.invalidate();
    },
  });
};

export const useTravelSettings = () => {
  return trpc.availability.getTravelSettings.useQuery();
};

export const useUpdateTravelSettings = () => {
  const utils = trpc.useUtils();
  return trpc.availability.updateTravelSettings.useMutation({
    onSuccess: () => {
      utils.availability.getTravelSettings.invalidate();
    },
  });
};

export const useVideoSettings = () => {
  return trpc.availability.getVideoSettings.useQuery();
};

export const useUpdateVideoSettings = () => {
  const utils = trpc.useUtils();
  return trpc.availability.updateVideoSettings.useMutation({
    onSuccess: () => {
      utils.availability.getVideoSettings.invalidate();
    },
  });
};

export const useAvailableSlots = (trainerId: string, date: string, durationMin?: number) => {
  return trpc.availability.getSlots.useQuery(
    { trainerId, date, durationMin },
    { enabled: !!trainerId && !!date },
  );
};

export const useAvailableDates = (
  trainerId: string,
  startDate: string,
  endDate: string,
  durationMin?: number,
) => {
  return trpc.availability.getDates.useQuery(
    { trainerId, startDate, endDate, durationMin },
    { enabled: !!trainerId && !!startDate && !!endDate },
  );
};
