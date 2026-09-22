import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { NotificationType } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

import { ListQueryDto } from '../../common/dto/list-query.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { PaginationService } from '../../common/services/pagination.service.js';
import { SortingService } from '../../common/services/sorting.service.js';

import { NotificationsService } from '../notifications/notifications.service.js';

import { CommentsMapper } from './comments.mapper.js';
import { CommentResponseDto } from './dto/comment-response.dto.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sortingService: SortingService,
    private readonly paginationService: PaginationService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    userId: string,
    postId: string,
    createCommentDto: CreateCommentDto,
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

    const comment = await this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        authorId: userId,
        postId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    if (post.authorId !== userId) {
      await this.notificationsService.create({
        recipientId: post.authorId,
        actorId: userId,
        type: NotificationType.COMMENT,
      });
    }

    return CommentsMapper.toResponse(comment);
  }

  async findAll(
    postId: string,
    listQueryDto: ListQueryDto,
  ): Promise<PaginatedResponseDto<CommentResponseDto>> {
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const sortOptions = this.sortingService.getSortOptions(
      listQueryDto.sortBy,
      listQueryDto.sortOrder,
      ['createdAt', 'updatedAt'],
      'createdAt',
    );

    const orderBy = {
      [sortOptions.field]: sortOptions.order,
    };

    const where = {
      postId,
      deletedAt: null,
    };

    const result = await this.paginationService.paginate(
      listQueryDto,
      (skip, take) =>
        this.prisma.comment.findMany({
          skip,
          take,
          where,
          orderBy,

          include: {
            author: {
              select: {
                id: true,
                username: true,
                profilePicture: true,
              },
            },

            _count: {
              select: {
                likes: true,
              },
            },
          },
        }),
      () => this.prisma.comment.count({ where }),
    );

    return {
      ...result,
      data: result.data.map((comment) => CommentsMapper.toResponse(comment)),
    };
  }

  async findById(id: string): Promise<CommentResponseDto> {
    const comment = await this.prisma.comment.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return CommentsMapper.toResponse(comment);
  }

  async update(
    id: string,
    userId: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    const comment = await this.prisma.comment.findFirst({
      where: {
        id,
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

    if (comment.authorId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to update this comment',
      );
    }

    const updatedComment = await this.prisma.comment.update({
      where: {
        id,
      },
      data: {
        content: updateCommentDto.content,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    return CommentsMapper.toResponse(updatedComment);
  }

  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.prisma.comment.findFirst({
      where: {
        id,
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

    if (comment.authorId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete this comment',
      );
    }

    await this.prisma.comment.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
