import { NOTIFICATION_ICON_MAP } from './notification.constants';
import { Bell, type LucideIcon } from 'lucide-react';

export const getNotificationIcon = (type: string): LucideIcon => {
  return NOTIFICATION_ICON_MAP[type] || Bell;
};

export const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return then.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
};
