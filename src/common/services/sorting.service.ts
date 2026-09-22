import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class SortingService {
  getSortOptions<T extends string>(
    sortBy: string | undefined,
    sortOrder: 'asc' | 'desc',
    allowedFields: readonly T[],
    defaultField: T,
  ): { field: T; order: 'asc' | 'desc' } {
    if (sortBy && !allowedFields.includes(sortBy as T)) {
      throw new BadRequestException(`Invalid sort field: ${sortBy}`);
    }

    return {
      field: (sortBy as T) || defaultField,
      order: sortOrder,
    };
  }
}
