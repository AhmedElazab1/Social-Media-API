import { BadRequestException } from '@nestjs/common';

import { NotificationType } from '../../generated/prisma/client.js';
import { NOTIFICATION_FILTER_FIELDS } from '../../modules/notifications/constants/notification-filter-fields.js';

export class NotificationQueryBuilder {
  static buildFilterWhere(filterOptions: {
    field: (typeof NOTIFICATION_FILTER_FIELDS)[number];
    value: string;
  }) {
    if (filterOptions.field === 'type') {
      if (
        !Object.values(NotificationType).includes(
          filterOptions.value as NotificationType,
        )
      ) {
        throw new BadRequestException('Invalid notification type');
      }

      return {
        type: filterOptions.value as NotificationType,
      };
    }

    if (filterOptions.field === 'isRead') {
      if (filterOptions.value !== 'true' && filterOptions.value !== 'false') {
        throw new BadRequestException('Invalid isRead value');
      }

      return {
        isRead: filterOptions.value === 'true',
      };
    }

    return {};
  }
}
