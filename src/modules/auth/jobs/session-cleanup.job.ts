import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { SessionService } from '../services/session.service.js';

@Injectable()
export class SessionCleanupJob {
  constructor(private readonly sessionService: SessionService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupSessions(): Promise<void> {
    await this.sessionService.cleanupSessions();
  }
}
