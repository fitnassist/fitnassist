import { trpc } from '@/lib/trpc';

export const useBooking = (id: string) => {
  return trpc.booking.get.useQuery({ id }, { enabled: !!id, refetchInterval: 10_000 });
};

export const useTrainerBookings = (startDate: string, endDate: string) => {
  return trpc.booking.listByDateRange.useQuery(
    { startDate, endDate },
    { enabled: !!startDate && !!endDate, refetchInterval: 10_000 }
  );
};

export const useUpcomingBookings = () => {
  return trpc.booking.upcoming.useQuery(undefined, { refetchInterval: 10_000 });
};

export const useClientRosterBookings = (clientRosterId: string) => {
  return trpc.booking.listByClientRoster.useQuery(
    { clientRosterId },
    { enabled: !!clientRosterId }
  );
};

const invalidateBookingQueries = (utils: ReturnType<typeof trpc.useUtils>) => {
  utils.booking.upcoming.invalidate();
  utils.booking.listByDateRange.invalidate();
  utils.booking.get.invalidate();
  utils.availability.getSlots.invalidate();
  utils.trainer.getDashboardStats.invalidate();
  utils.analytics.bookingAnalytics.invalidate();
};

export const useCreateBooking = () => {
  const utils = trpc.useUtils();
  return trpc.booking.create.useMutation({
    onSuccess: () => invalidateBookingQueries(utils),
  });
};

export const useCreateBookingForClient = () => {
  const utils = trpc.useUtils();
  return trpc.booking.createForClient.useMutation({
    onSuccess: () => invalidateBookingQueries(utils),
  });
};

export const useConfirmBooking = () => {
  const utils = trpc.useUtils();
  return trpc.booking.confirm.useMutation({
    onSuccess: () => invalidateBookingQueries(utils),
  });
};

export const useDeclineBooking = () => {
  const utils = trpc.useUtils();
  return trpc.booking.decline.useMutation({
    onSuccess: () => invalidateBookingQueries(utils),
  });
};

export const useRescheduleBooking = () => {
  const utils = trpc.useUtils();
  return trpc.booking.reschedule.useMutation({
    onSuccess: () => invalidateBookingQueries(utils),
  });
};

export const useSuggestAlternative = () => {
  const utils = trpc.useUtils();
  return trpc.booking.suggestAlternative.useMutation({
    onSuccess: () => {
      utils.booking.getSuggestions.invalidate();
      utils.booking.get.invalidate();
    },
  });
};

export const useRespondToSuggestion = () => {
  const utils = trpc.useUtils();
  return trpc.booking.respondToSuggestion.useMutation({
    onSuccess: () => invalidateBookingQueries(utils),
  });
};

export const useBookingSuggestions = (bookingId: string) => {
  return trpc.booking.getSuggestions.useQuery(
    { bookingId },
    { enabled: !!bookingId }
  );
};

export const useCancelBooking = () => {
  const utils = trpc.useUtils();
  return trpc.booking.cancel.useMutation({
    onSuccess: () => invalidateBookingQueries(utils),
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
