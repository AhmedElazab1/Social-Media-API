import { Injectable, UnauthorizedException } from '@nestjs/common';

import { TokenService } from './token.service.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

import { RefreshTokenResult } from '../types/refresh-token.types.js';

@Injectable()
export class RefreshTokenService {
  private isP2034Error(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2034'
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async create(userId: string): Promise<RefreshTokenResult> {
    const refreshToken = this.tokenService.generateSecureToken();

    const refreshTokenHash = this.tokenService.hashToken(refreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        expiresAt,
      },
    });

    return {
      refreshToken,
      sessionId: session.id,
      userId: session.userId,
      expiresAt,
    };
  }

  async rotateToken(rawToken: string): Promise<RefreshTokenResult> {
    const refreshTokenHash = this.tokenService.hashToken(rawToken);

    // Check the token before starting the rotation transaction.
    const session = await this.prisma.session.findFirst({
      where: { refreshTokenHash },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // The token was already rotated before.
    // Revoke all active sessions outside the transaction
    // because throwing inside a transaction would rollback revokeAll.
    if (session.revokedAt && session.replacedById) {
      await this.revokeAll(session.userId);

      throw new UnauthorizedException('Refresh token replay detected');
    }

    // Session was revoked for another reason.
    if (session.revokedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Token has expired.
    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            // Atomically consume the refresh token.
            const revoked = await tx.session.updateMany({
              where: {
                id: session.id,
                revokedAt: null,
              },
              data: {
                revokedAt: new Date(),
              },
            });

            if (revoked.count === 0) {
              throw new UnauthorizedException('Refresh token already used');
            }

            // Generate a new refresh token.
            const newRefreshToken = this.tokenService.generateSecureToken();

            const newRefreshTokenHash =
              this.tokenService.hashToken(newRefreshToken);

            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            // Create the new session.
            const newSession = await tx.session.create({
              data: {
                userId: session.userId,
                refreshTokenHash: newRefreshTokenHash,
                expiresAt,
              },
            });

            // Link the old session to the new one.
            await tx.session.update({
              where: {
                id: session.id,
              },
              data: {
                replacedById: newSession.id,
              },
            });

            return {
              refreshToken: newRefreshToken,
              sessionId: newSession.id,
              userId: session.userId,
              expiresAt,
            };
          },
          {
            isolationLevel: 'Serializable',
          },
        );
      } catch (error) {
        // Don't retry authentication/business errors.
        if (!this.isP2034Error(error)) {
          throw error;
        }

        // Last attempt failed.
        if (attempt === maxRetries) {
          throw error;
        }

        // Small backoff before retrying.
        await this.delay(20 * attempt);
      }
    }

    throw new Error('Refresh token rotation failed');
  }

  async revoke(refreshToken: string): Promise<void> {
    const refreshTokenHash = this.tokenService.hashToken(refreshToken);

    const session = await this.prisma.session.findFirst({
      where: {
        refreshTokenHash,
        revokedAt: null,
      },
    });

    if (!session) {
      return;
    }

    await this.prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async revokeAll(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
