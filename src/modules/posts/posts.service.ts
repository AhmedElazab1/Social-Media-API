import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';

import { CreatePostDto } from './dto/create-post.dto.js';
import { PostResponseDto } from './dto/post-response.dto.js';
import { PostsMapper } from './posts.mapper.js';
import { PaginationService } from '../../common/services/pagination.service.js';
import { SortingService } from '../../common/services/sorting.service.js';
import { FilteringService } from '../../common/services/filtering.service.js';
import { SearchingService } from '../../common/services/searching.service.js';
import { ListQueryDto } from '../../common/dto/list-query.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { CreateMediaDto } from './dto/create-media.dto.js';

type PostFilterField = 'content' | 'authorId';

const POST_FILTER_FIELDS: PostFilterField[] = ['content', 'authorId'];

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly sortingService: SortingService,
    private readonly filteringService: FilteringService,
    private readonly searchingService: SearchingService,
  ) {}

  async findAll(
    listQueryDto: ListQueryDto,
  ): Promise<PaginatedResponseDto<PostResponseDto>> {
    const sortOptions = this.sortingService.getSortOptions(
      listQueryDto.sortBy,
      listQueryDto.sortOrder,
      ['createdAt', 'updatedAt'],
      'createdAt',
    );

    const orderBy = {
      [sortOptions.field]: sortOptions.order,
    };

    const filterOptions = this.filteringService.getFilterOptions(
      listQueryDto.filter,
      POST_FILTER_FIELDS,
    );

    const filterWhere = filterOptions
      ? this.buildFilterWhere(filterOptions)
      : undefined;

    const searchTerm = this.searchingService.getSearchTerm(listQueryDto.search);

    const searchWhere = searchTerm
      ? this.buildSearchWhere(searchTerm)
      : undefined;

    const conditions = [filterWhere, searchWhere].filter(
      (x): x is NonNullable<typeof x> => x != null,
    );

    const where = {
      deletedAt: null,
      ...(conditions.length > 0 && {
        AND: conditions,
      }),
    };

    const result = await this.paginationService.paginate(
      listQueryDto,
      (skip, take) =>
        this.prisma.post.findMany({
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

            mediaFiles: {
              select: {
                id: true,
                url: true,
                type: true,
              },
            },

            _count: {
              select: {
                comments: true,
                likes: true,
              },
            },
          },
        }),
      () => this.prisma.post.count({ where }),
    );

    return {
      ...result,
      data: result.data.map((post) => PostsMapper.toResponse(post)),
    };
  }

  private buildFilterWhere(filterOptions: {
    field: PostFilterField;
    value: string;
  }) {
    return {
      [filterOptions.field]: {
        contains: filterOptions.value,
        mode: 'insensitive' as const,
      },
    };
  }

  private buildSearchWhere(searchTerm: string) {
    return {
      OR: [
        {
          content: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        {
          author: {
            username: {
              contains: searchTerm,
              mode: 'insensitive' as const,
            },
          },
        },
      ],
    };
  }

  async create(
    userId: string,
    createPostDto: CreatePostDto,
  ): Promise<PostResponseDto> {
    if (!createPostDto.content && !createPostDto.media?.length) {
      throw new BadRequestException(
        'Post must contain content or at least one media',
      );
    }

    const post = await this.prisma.post.create({
      data: {
        content: createPostDto.content,
        authorId: userId,

        mediaFiles: {
          create: createPostDto.media?.map((media) => ({
            url: media.url,
            type: media.type,
          })),
        },
      },

      include: {
        author: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },

        mediaFiles: {
          select: {
            id: true,
            url: true,
            type: true,
          },
        },

        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    return PostsMapper.toResponse(post);
  }

  async findById(id: string): Promise<PostResponseDto> {
    const post = await this.prisma.post.findFirst({
      where: { id, deletedAt: null },

      include: {
        author: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },

        mediaFiles: {
          select: {
            id: true,
            url: true,
            type: true,
          },
        },

        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }

    return PostsMapper.toResponse(post);
  }

  async update(
    id: string,
    userId: string,
    updatePostDto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    const post = await this.prisma.post.findFirst({
      where: {
        id,
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

    if (post.authorId !== userId) {
      throw new ForbiddenException('You are not allowed to update this post');
    }

    const updatedPost = await this.prisma.post.update({
      where: {
        id,
      },
      data: {
        content: updatePostDto.content,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        mediaFiles: {
          select: {
            id: true,
            url: true,
            type: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    return PostsMapper.toResponse(updatedPost);
  }

  async remove(id: string, userId: string): Promise<void> {
    const post = await this.prisma.post.findFirst({
      where: {
        id,
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

    if (post.authorId !== userId) {
      throw new ForbiddenException('You are not allowed to delete this post');
    }

    await this.prisma.post.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async addMedia(
    postId: string,
    userId: string,
    createMediaDto: CreateMediaDto,
  ): Promise<PostResponseDto> {
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

    if (post.authorId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to add media to this post',
      );
    }

    await this.prisma.media.create({
      data: {
        url: createMediaDto.url,
        type: createMediaDto.type,
        postId,
      },
    });

    const updatedPost = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        mediaFiles: {
          select: {
            id: true,
            url: true,
            type: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    return PostsMapper.toResponse(updatedPost!);
  }

  async removeMedia(
    postId: string,
    mediaId: string,
    userId: string,
  ): Promise<PostResponseDto> {
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

    if (post.authorId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete media from this post',
      );
    }

    const media = await this.prisma.media.findFirst({
      where: {
        id: mediaId,
        postId,
      },
      select: {
        id: true,
      },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    await this.prisma.media.delete({
      where: {
        id: mediaId,
      },
    });

    const updatedPost = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        mediaFiles: {
          select: {
            id: true,
            url: true,
            type: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    return PostsMapper.toResponse(updatedPost!);
  }
}
