import { NotificationResponseDto } from './dto/notification-response.dto.js';

type NotificationWithActor = {
  id: string;
  type: NotificationResponseDto['type'];
  message: string;
  isRead: boolean;
  createdAt: Date;
  actor: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
  } | null;
};

export function toNotificationResponse(
  notification: NotificationWithActor,
): NotificationResponseDto {
  return {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,

    actor: notification.actor
      ? {
          id: notification.actor.id,
          username: notification.actor.username,
          firstName: notification.actor.firstName,
          lastName: notification.actor.lastName,
          profilePicture: notification.actor.profilePicture,
        }
      : null,
  };
}
