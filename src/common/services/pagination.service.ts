import { Injectable } from '@nestjs/common';

import { PaginationDto } from '../dto/pagination.dto.js';

@Injectable()
export class PaginationService {
  async paginate<T>(
    pagination: PaginationDto,
    findMany: (skip: number, take: number) => Promise<T[]>,
    count: () => Promise<number>,
  ) {
    const { page, limit } = pagination;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([findMany(skip, limit), count()]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
