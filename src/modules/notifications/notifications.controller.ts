import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { NotificationsService } from './notifications.service.js';
import { ListQueryDto } from 'src/common/dto/list-query.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @CurrentUser('userId') userId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.notificationsService.findAll(userId, query);
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') notificationId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.notificationsService.markAsRead(notificationId, userId);
  }

  @Delete(':id')
  async remove(
    @Param('id') notificationId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.notificationsService.remove(notificationId, userId);
  }
}
