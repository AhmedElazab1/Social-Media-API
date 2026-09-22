import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';
import { ListQueryDto } from '../../common/dto/list-query.dto.js';
import { FilteringService } from '../../common/services/filtering.service.js';
import { PaginationService } from '../../common/services/pagination.service.js';
import { SortingService } from '../../common/services/sorting.service.js';
import { NotificationQueryBuilder } from '../../common/query/notification-query.builder.js';
import { NOTIFICATION_FILTER_FIELDS } from './constants/notification-filter-fields.js';
import { toNotificationResponse } from './notification.mapper.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { NotificationResponseDto } from './dto/notification-response.dto.js';
import { CreateNotificationInput } from './types/create-notification.input.js';
import { NotificationType } from 'src/generated/prisma/enums.js';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly sortingService: SortingService,
    private readonly filteringService: FilteringService,
  ) {}

  async findAll(
    userId: string,
    listQueryDto: ListQueryDto,
  ): Promise<PaginatedResponseDto<NotificationResponseDto>> {
    const sortOptions = this.sortingService.getSortOptions(
      listQueryDto.sortBy,
      listQueryDto.sortOrder,
      ['createdAt'],
      'createdAt',
    );

    const orderBy = {
      [sortOptions.field]: sortOptions.order,
    };

    const filterOptions = this.filteringService.getFilterOptions(
      listQueryDto.filter,
      NOTIFICATION_FILTER_FIELDS,
    );

    const filterWhere = filterOptions
      ? NotificationQueryBuilder.buildFilterWhere(filterOptions)
      : undefined;

    const where = {
      recipientId: userId,

      ...(filterWhere ?? {}),
    };

    const result = await this.paginationService.paginate(
      listQueryDto,
      (skip, take) =>
        this.prisma.notification.findMany({
          skip,
          take,
          where,
          orderBy,

          include: {
            actor: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                profilePicture: true,
              },
            },
          },
        }),
      () => this.prisma.notification.count({ where }),
    );

    return {
      ...result,
      data: result.data.map(toNotificationResponse),
    };
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        recipientId: userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const updatedNotification = await this.prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        isRead: true,
      },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
    });

    return toNotificationResponse(updatedNotification);
  }

  async markAllAsRead(userId: string): Promise<{ updatedCount: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        recipientId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return {
      updatedCount: result.count,
    };
  }

  async remove(notificationId: string, userId: string): Promise<void> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        recipientId: userId,
      },
      select: {
        id: true,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: {
        id: notification.id,
      },
    });
  }

  async create(
    input: CreateNotificationInput,
  ): Promise<NotificationResponseDto> {
    const actor = await this.prisma.user.findUnique({
      where: {
        id: input.actorId,
      },
      select: {
        username: true,
      },
    });

    if (!actor) {
      throw new NotFoundException('Actor not found');
    }

    const notification = await this.prisma.notification.create({
      data: {
        recipientId: input.recipientId,
        actorId: input.actorId,
        type: input.type,
        message: this.buildMessage(input.type, actor.username),
      },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
    });

    return toNotificationResponse(notification);
  }

  private buildMessage(type: NotificationType, actorUsername: string): string {
    switch (type) {
      case NotificationType.LIKE:
        return `${actorUsername} liked your post.`;

      case NotificationType.COMMENT:
        return `${actorUsername} commented on your post.`;

      case NotificationType.FOLLOW:
        return `${actorUsername} started following you.`;

      case NotificationType.MENTION:
        return `${actorUsername} mentioned you.`;
    }
  }
}
