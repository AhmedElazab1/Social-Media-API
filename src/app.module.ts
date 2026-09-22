import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { envSchema } from './config/env.js';
import { UsersModule } from './modules/users/users.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import { PostsModule } from './modules/posts/posts.module.js';
import { CommonModule } from './common/common.module.js';
import { CommentsModule } from './modules/comments/comments.module.js';
import { ReactionsModule } from './modules/reactions/reactions.module.js';
import { FollowsModule } from './modules/follows/follows.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (schema) => envSchema.parse(schema),
    }),
    PrismaModule,
    CommonModule,
    UsersModule,
    AuthModule,
    PostsModule,
    CommentsModule,
    ReactionsModule,
    FollowsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
