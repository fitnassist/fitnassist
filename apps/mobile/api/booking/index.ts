import { trpc } from '@/lib/trpc';

export const useUpcomingBookings = () => {
  return trpc.booking.upcoming.useQuery();
};
