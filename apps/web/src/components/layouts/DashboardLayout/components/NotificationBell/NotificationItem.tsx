import { X } from 'lucide-react';
import { Button } from '@/components/ui';
import { getNotificationIcon, formatRelativeTime } from './notification.utils';
import type { NotificationItemData } from './notification.types';

interface NotificationItemProps {
  notification: NotificationItemData;
  onNavigate: (notification: NotificationItemData) => void;
  onDismiss: (id: string) => void;
}

export const NotificationItem = ({ notification, onNavigate, onDismiss }: NotificationItemProps) => {
  const Icon = getNotificationIcon(notification.type);

  return (
    <div
      className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
        !notification.isRead ? 'bg-primary/5' : ''
      }`}
      onClick={() => onNavigate(notification)}
    >
      <div className="flex-shrink-0 mt-0.5">
        <div className={`rounded-full p-1.5 ${!notification.isRead ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-tight ${!notification.isRead ? 'font-medium' : 'text-muted-foreground'}`}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.body}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(notification.id);
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};
