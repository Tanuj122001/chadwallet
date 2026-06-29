export interface NotificationDTO {
  notification_id: string;
  title: string;
  body: string;
  timestamp: number;
  is_read: boolean;
  type: 'price_alert' | 'transaction' | 'security' | 'general';
  payload?: Record<string, any>;
}

export interface NotificationStateDTO {
  unread_count: number;
  notifications: NotificationDTO[];
}
