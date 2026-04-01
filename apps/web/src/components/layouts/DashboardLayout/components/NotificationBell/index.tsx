import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@/components/ui';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDismissNotification,
} from '@/api/notification';
import { NotificationPanel } from './NotificationPanel';
import type { NotificationItemData } from './notification.types';

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const dismiss = useDismissNotification();

  const notifications = data?.pages.flatMap((page) => page.items) ?? [];

  const handleNavigate = (notification: NotificationItemData) => {
    if (!notification.isRead) {
      markRead.mutate({ id: notification.id });
    }
    if (notification.link) {
      navigate(notification.link);
    }
    setOpen(false);
  };

  const handleDismiss = (id: string) => {
    dismiss.mutate({ id });
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-white/80 hover:text-white hover:bg-white/10"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-gray-900">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0 w-80 sm:w-96">
        <NotificationPanel
          notifications={notifications}
          isLoading={isLoading}
          hasMore={!!hasNextPage}
          onLoadMore={() => fetchNextPage()}
          isFetchingMore={isFetchingNextPage}
          onNavigate={handleNavigate}
          onDismiss={handleDismiss}
          onMarkAllRead={handleMarkAllRead}
          hasUnread={unreadCount > 0}
        />
      </PopoverContent>
    </Popover>
  );
};
