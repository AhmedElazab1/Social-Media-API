import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  REFRESH_TOKEN_EXPIRES_IN,
  REVOKED_SESSION_EXPIRES_IN,
} from '../constants/auth.constants.js';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async cleanupSessions(): Promise<void> {
    const now = new Date();

    const refreshTokenRetentionDate = new Date(
      now.getTime() - REFRESH_TOKEN_EXPIRES_IN,
    );

    const revokedRetentionDate = new Date(
      now.getTime() - REVOKED_SESSION_EXPIRES_IN,
    );

    await this.prisma.session.deleteMany({
      where: {
        OR: [
          {
            expiresAt: {
              lt: refreshTokenRetentionDate,
            },
          },
          {
            revokedAt: {
              not: null,
              lt: revokedRetentionDate,
            },
          },
        ],
      },
    });
  }
}
