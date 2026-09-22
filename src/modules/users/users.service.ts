import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';
import { toUserResponse } from './users.mapper.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from 'src/generated/prisma/client.js';
import { ListQueryDto } from 'src/common/dto/list-query.dto.js';
import { PaginationService } from 'src/common/services/pagination.service.js';
import { SortingService } from 'src/common/services/sorting.service.js';
import { FilteringService } from 'src/common/services/filtering.service.js';
import { SearchingService } from 'src/common/services/searching.service.js';
import { UpdateMeDto } from './dto/update-me.dto.js';
import { USER_FILTER_FIELDS } from './constants/user-filter-fields.js';
import { UserQueryBuilder } from '../../common/query/user-query.builder.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly sortingService: SortingService,
    private readonly filteringService: FilteringService,
    private readonly searchingService: SearchingService,
  ) {}

  async create(data: {
    email: string;
    username: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email, deletedAt: null },
    });
  }

  async findAll(listQueryDto: ListQueryDto) {
    const sortOptions = this.sortingService.getSortOptions(
      listQueryDto.sortBy,
      listQueryDto.sortOrder,
      ['email', 'username', 'createdAt'],
      'createdAt',
    );

    const orderBy = {
      [sortOptions.field]: sortOptions.order,
    };

    const filterOptions = this.filteringService.getFilterOptions(
      listQueryDto.filter,
      USER_FILTER_FIELDS,
    );

    const filterWhere = filterOptions
      ? UserQueryBuilder.buildFilterWhere(filterOptions)
      : undefined;

    const searchTerm = this.searchingService.getSearchTerm(listQueryDto.search);

    const searchWhere = searchTerm
      ? UserQueryBuilder.buildSearchWhere(searchTerm)
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
        this.prisma.user.findMany({
          skip,
          take,
          where,
          orderBy,
        }),
      () => this.prisma.user.count({ where }),
    );

    return {
      ...result,
      data: result.data.map(toUserResponse),
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return toUserResponse(user);
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    return toUserResponse(updatedUser);
  }

  async updateMe(id: string, updateMeDto: UpdateMeDto) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateMeDto,
    });

    return toUserResponse(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
