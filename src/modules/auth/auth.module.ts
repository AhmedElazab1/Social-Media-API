import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '../users/users.module.js';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

import { TokenService } from './services/token.service.js';
import { RefreshTokenService } from './services/refresh-token.service.js';

import { JwtStrategy } from './strategies/jwt.strategy.js';

import { SessionCleanupJob } from './jobs/session-cleanup.job.js';
import { SessionService } from './services/session.service.js';

@Module({
  imports: [
    UsersModule,
    PassportModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    TokenService,
    RefreshTokenService,
    JwtStrategy,
    SessionService,
    SessionCleanupJob,
  ],
})
export class AuthModule {}
