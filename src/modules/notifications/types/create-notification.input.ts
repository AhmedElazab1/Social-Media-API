import { NotificationType } from '../../../generated/prisma/client.js';

export type CreateNotificationInput = {
  recipientId: string;
  actorId: string;
  type: NotificationType;
};
