import { trpc } from '@/lib/trpc';

export const useUpcomingBookings = () => {
  return trpc.booking.upcoming.useQuery();
};

export const useBooking = (id: string) => {
  return trpc.booking.get.useQuery(
    { id },
    { enabled: !!id },
  );
};

export const useTrainerBookings = (startDate: string, endDate: string) => {
  return trpc.booking.listByDateRange.useQuery(
    { startDate, endDate },
    { enabled: !!startDate && !!endDate },
  );
};

export const usePendingBookingCount = () => {
  return trpc.booking.getPendingCount.useQuery();
};

export const useBookingSuggestions = (bookingId: string) => {
  return trpc.booking.getSuggestions.useQuery(
    { bookingId },
    { enabled: !!bookingId },
  );
};

const useInvalidateBookings = () => {
  const utils = trpc.useUtils();
  return () => {
    utils.booking.upcoming.invalidate();
    utils.booking.listByDateRange.invalidate();
    utils.booking.getPendingCount.invalidate();
  };
};

export const useConfirmBooking = () => {
  const invalidate = useInvalidateBookings();
  return trpc.booking.confirm.useMutation({ onSuccess: invalidate });
};

export const useDeclineBooking = () => {
  const invalidate = useInvalidateBookings();
  return trpc.booking.decline.useMutation({ onSuccess: invalidate });
};

export const useCancelBooking = () => {
  const invalidate = useInvalidateBookings();
  return trpc.booking.cancel.useMutation({ onSuccess: invalidate });
};

export const useCompleteBooking = () => {
  const invalidate = useInvalidateBookings();
  return trpc.booking.complete.useMutation({ onSuccess: invalidate });
};

export const useNoShowBooking = () => {
  const invalidate = useInvalidateBookings();
  return trpc.booking.noShow.useMutation({ onSuccess: invalidate });
};

export const useRescheduleBooking = () => {
  const invalidate = useInvalidateBookings();
  return trpc.booking.reschedule.useMutation({ onSuccess: invalidate });
};
