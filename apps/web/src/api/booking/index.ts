import { trpc } from '@/lib/trpc';

export const useBooking = (id: string) => {
  return trpc.booking.get.useQuery({ id }, { enabled: !!id });
};

export const useTrainerBookings = (startDate: string, endDate: string) => {
  return trpc.booking.listByDateRange.useQuery(
    { startDate, endDate },
    { enabled: !!startDate && !!endDate }
  );
};

export const useUpcomingBookings = () => {
  return trpc.booking.upcoming.useQuery();
};

export const useClientRosterBookings = (clientRosterId: string) => {
  return trpc.booking.listByClientRoster.useQuery(
    { clientRosterId },
    { enabled: !!clientRosterId }
  );
};

export const useCreateBooking = () => {
  const utils = trpc.useUtils();
  return trpc.booking.create.useMutation({
    onSuccess: () => {
      utils.booking.upcoming.invalidate();
      utils.booking.listByDateRange.invalidate();
      utils.availability.getSlots.invalidate();
      utils.trainer.getDashboardStats.invalidate();
      utils.analytics.bookingAnalytics.invalidate();
    },
  });
};

export const useCancelBooking = () => {
  const utils = trpc.useUtils();
  return trpc.booking.cancel.useMutation({
    onSuccess: () => {
      utils.booking.upcoming.invalidate();
      utils.booking.listByDateRange.invalidate();
      utils.availability.getSlots.invalidate();
      utils.trainer.getDashboardStats.invalidate();
      utils.analytics.bookingAnalytics.invalidate();
    },
  });
};

export const useCompleteBooking = () => {
  const utils = trpc.useUtils();
  return trpc.booking.complete.useMutation({
    onSuccess: () => {
      utils.booking.listByDateRange.invalidate();
      utils.trainer.getDashboardStats.invalidate();
      utils.analytics.bookingAnalytics.invalidate();
    },
  });
};

export const useNoShowBooking = () => {
  const utils = trpc.useUtils();
  return trpc.booking.noShow.useMutation({
    onSuccess: () => {
      utils.booking.listByDateRange.invalidate();
      utils.trainer.getDashboardStats.invalidate();
      utils.analytics.bookingAnalytics.invalidate();
    },
  });
};
