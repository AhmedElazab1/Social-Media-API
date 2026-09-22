export const NOTIFICATION_FILTER_FIELDS = ['type', 'isRead'] as const;

export type NotificationFilterField =
  (typeof NOTIFICATION_FILTER_FIELDS)[number];
