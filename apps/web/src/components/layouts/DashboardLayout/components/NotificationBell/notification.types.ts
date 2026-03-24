export interface NotificationItemData {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: unknown;
  link: string | null;
  isRead: boolean;
  readAt: Date | null;
  isDismissed: boolean;
  createdAt: Date;
}
