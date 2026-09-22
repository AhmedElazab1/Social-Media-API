import { Injectable, NotFoundException } from '@nestjs/common';

import { NotificationType } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

import { CreateReactionDto } from './dto/create-reaction.dto.js';

@Injectable()
export class ReactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async reactToPost(
    userId: string,
    postId: string,
    createReactionDto: CreateReactionDto,
  ) {
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingReaction = await this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!existingReaction) {
      const reaction = await this.prisma.like.create({
        data: {
          userId,
          postId,
          type: createReactionDto.type,
        },
      });

      if (post.authorId !== userId) {
        await this.notificationsService.create({
          recipientId: post.authorId,
          actorId: userId,
          type: NotificationType.LIKE,
        });
      }

      return reaction;
    }

    if (existingReaction.type === createReactionDto.type) {
      return existingReaction;
    }

    return this.prisma.like.update({
      where: {
        id: existingReaction.id,
      },
      data: {
        type: createReactionDto.type,
      },
    });
  }

  async reactToComment(
    userId: string,
    commentId: string,
    createReactionDto: CreateReactionDto,
  ) {
    const comment = await this.prisma.comment.findFirst({
      where: {
        id: commentId,
        deletedAt: null,
      },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const existingReaction = await this.prisma.like.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    if (!existingReaction) {
      const reaction = await this.prisma.like.create({
        data: {
          userId,
          commentId,
          type: createReactionDto.type,
        },
      });

      if (comment.authorId !== userId) {
        await this.notificationsService.create({
          recipientId: comment.authorId,
          actorId: userId,
          type: NotificationType.LIKE,
        });
      }

      return reaction;
    }

    if (existingReaction.type === createReactionDto.type) {
      return existingReaction;
    }

    return this.prisma.like.update({
      where: {
        id: existingReaction.id,
      },
      data: {
        type: createReactionDto.type,
      },
    });
  }

  async removePostReaction(userId: string, postId: string): Promise<void> {
    const reaction = await this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    await this.prisma.like.delete({
      where: {
        id: reaction.id,
      },
    });
  }

  async removeCommentReaction(
    userId: string,
    commentId: string,
  ): Promise<void> {
    const reaction = await this.prisma.like.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    await this.prisma.like.delete({
      where: {
        id: reaction.id,
      },
    });
  }
}
