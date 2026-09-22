import { Module } from '@nestjs/common';

import { CommentsController } from './comments.controller.js';
import { CommentsService } from './comments.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService],
  imports: [NotificationsModule],
})
export class CommentsModule {}
