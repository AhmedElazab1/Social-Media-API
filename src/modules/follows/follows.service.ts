import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { NotificationType } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ListQueryDto } from 'src/common/dto/list-query.dto.js';
import { PaginationService } from 'src/common/services/pagination.service.js';
import { SortingService } from 'src/common/services/sorting.service.js';
import { FilteringService } from 'src/common/services/filtering.service.js';
import { SearchingService } from 'src/common/services/searching.service.js';
import { UserQueryBuilder } from 'src/common/query/user-query.builder.js';
import { toUserResponse } from '../users/users.mapper.js';
import { USER_FILTER_FIELDS } from '../users/constants/user-filter-fields.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { UserResponseDto } from '../users/dto/user-response.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class FollowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly sortingService: SortingService,
    private readonly filteringService: FilteringService,
    private readonly searchingService: SearchingService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async follow(userId: string, followingId: string) {
    if (userId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: followingId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId,
        },
      },
    });

    if (!existingFollow) {
      const follow = await this.prisma.follow.create({
        data: {
          followerId: userId,
          followingId,
        },
      });

      await this.notificationsService.create({
        recipientId: followingId,
        actorId: userId,
        type: NotificationType.FOLLOW,
      });

      return follow;
    }

    if (existingFollow.unfollowedAt !== null) {
      const follow = await this.prisma.follow.update({
        where: {
          id: existingFollow.id,
        },
        data: {
          unfollowedAt: null,
        },
      });

      await this.notificationsService.create({
        recipientId: followingId,
        actorId: userId,
        type: NotificationType.FOLLOW,
      });

      return follow;
    }

    return existingFollow;
  }

  async unfollow(userId: string, followingId: string) {
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId,
        },
      },
    });

    if (!existingFollow) {
      throw new NotFoundException('Follow relationship not found');
    }

    if (existingFollow.unfollowedAt !== null) {
      return existingFollow;
    }

    return this.prisma.follow.update({
      where: {
        id: existingFollow.id,
      },
      data: {
        unfollowedAt: new Date(),
      },
    });
  }

  async findFollowers(
    userId: string,
    listQueryDto: ListQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const sortOptions = this.sortingService.getSortOptions(
      listQueryDto.sortBy,
      listQueryDto.sortOrder,
      ['username', 'createdAt'],
      'createdAt',
    );

    const orderBy =
      sortOptions.field === 'username'
        ? {
            follower: {
              username: sortOptions.order,
            },
          }
        : {
            createdAt: sortOptions.order,
          };

    const searchTerm = this.searchingService.getSearchTerm(listQueryDto.search);

    const searchWhere = searchTerm
      ? UserQueryBuilder.buildSearchWhere(searchTerm)
      : undefined;

    const filterOptions = this.filteringService.getFilterOptions(
      listQueryDto.filter,
      USER_FILTER_FIELDS,
    );

    const filterWhere = filterOptions
      ? UserQueryBuilder.buildFilterWhere(filterOptions)
      : undefined;

    const userConditions = [filterWhere, searchWhere].filter(
      (x): x is NonNullable<typeof x> => x != null,
    );

    const where = {
      followingId: userId,
      unfollowedAt: null,

      ...(userConditions.length > 0 && {
        follower: {
          AND: userConditions,
        },
      }),
    };

    const result = await this.paginationService.paginate(
      listQueryDto,
      (skip, take) =>
        this.prisma.follow.findMany({
          skip,
          take,
          where,
          orderBy,

          include: {
            follower: true,
          },
        }),
      () => this.prisma.follow.count({ where }),
    );

    return {
      ...result,
      data: result.data.map((follow) => toUserResponse(follow.follower)),
    };
  }

  async findFollowing(
    userId: string,
    listQueryDto: ListQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const sortOptions = this.sortingService.getSortOptions(
      listQueryDto.sortBy,
      listQueryDto.sortOrder,
      ['username', 'createdAt'],
      'createdAt',
    );

    const orderBy =
      sortOptions.field === 'username'
        ? {
            following: {
              username: sortOptions.order,
            },
          }
        : {
            createdAt: sortOptions.order,
          };

    const searchTerm = this.searchingService.getSearchTerm(listQueryDto.search);

    const searchWhere = searchTerm
      ? UserQueryBuilder.buildSearchWhere(searchTerm)
      : undefined;

    const filterOptions = this.filteringService.getFilterOptions(
      listQueryDto.filter,
      USER_FILTER_FIELDS,
    );

    const filterWhere = filterOptions
      ? UserQueryBuilder.buildFilterWhere(filterOptions)
      : undefined;

    const userConditions = [filterWhere, searchWhere].filter(
      (x): x is NonNullable<typeof x> => x != null,
    );

    const where = {
      followerId: userId,
      unfollowedAt: null,

      ...(userConditions.length > 0 && {
        following: {
          AND: userConditions,
        },
      }),
    };

    const result = await this.paginationService.paginate(
      listQueryDto,
      (skip, take) =>
        this.prisma.follow.findMany({
          skip,
          take,
          where,
          orderBy,

          include: {
            following: true,
          },
        }),
      () => this.prisma.follow.count({ where }),
    );

    return {
      ...result,
      data: result.data.map((follow) => toUserResponse(follow.following)),
    };
  }
}
