import { Module } from '@nestjs/common';

import { ReactionsController } from './reactions.controller.js';
import { ReactionsService } from './reactions.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  controllers: [ReactionsController],
  providers: [ReactionsService],
  imports: [NotificationsModule],
})
export class ReactionsModule {}
