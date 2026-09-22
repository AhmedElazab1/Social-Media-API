import { NotificationType } from '../../../generated/prisma/client.js';

export class NotificationActorDto {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePicture: string | null;
}

export class NotificationResponseDto {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actor: NotificationActorDto | null;
}
