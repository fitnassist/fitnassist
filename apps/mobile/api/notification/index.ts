import { trpc } from '@/lib/trpc';

export const useUnreadNotificationCount = () => {
  return trpc.notification.getUnreadCount.useQuery(undefined, {
    refetchInterval: 5000,
  });
};
