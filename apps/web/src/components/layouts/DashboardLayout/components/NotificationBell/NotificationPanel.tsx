import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { Button, ScrollArea } from '@/components/ui';
import { NotificationItem } from './NotificationItem';
import type { NotificationItemData } from './notification.types';

interface NotificationPanelProps {
  notifications: NotificationItemData[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isFetchingMore: boolean;
  onNavigate: (notification: NotificationItemData) => void;
  onDismiss: (id: string) => void;
  onMarkAllRead: () => void;
  hasUnread: boolean;
}

export const NotificationPanel = ({
  notifications,
  isLoading,
  hasMore,
  onLoadMore,
  isFetchingMore,
  onNavigate,
  onDismiss,
  onMarkAllRead,
  hasUnread,
}: NotificationPanelProps) => {
  return (
    <div className="w-80 sm:w-96">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-sm">Notifications</h3>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={onMarkAllRead}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      <ScrollArea className="max-h-[60vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Bell className="h-8 w-8 mb-2" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div key={notification.id} className="group">
                <NotificationItem
                  notification={notification}
                  onNavigate={onNavigate}
                  onDismiss={onDismiss}
                />
              </div>
            ))}
            {hasMore && (
              <div className="p-2 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={onLoadMore}
                  disabled={isFetchingMore}
                >
                  {isFetchingMore ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : null}
                  Load more
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
