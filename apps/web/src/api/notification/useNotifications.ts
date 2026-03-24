import { trpc } from '@/lib/trpc';

export const useNotifications = (cursor?: string) => {
  return trpc.notification.list.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialCursor: cursor,
    }
  );
};

export const useUnreadNotificationCount = () => {
  return trpc.notification.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
  });
};

export const useMarkNotificationRead = () => {
  const utils = trpc.useUtils();

  return trpc.notification.markRead.useMutation({
    onSuccess: () => {
      utils.notification.getUnreadCount.invalidate();
      utils.notification.list.invalidate();
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const utils = trpc.useUtils();

  return trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      utils.notification.getUnreadCount.invalidate();
      utils.notification.list.invalidate();
    },
  });
};

export const useDismissNotification = () => {
  const utils = trpc.useUtils();

  return trpc.notification.dismiss.useMutation({
    onSuccess: () => {
      utils.notification.getUnreadCount.invalidate();
      utils.notification.list.invalidate();
    },
  });
};
