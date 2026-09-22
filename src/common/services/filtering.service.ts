import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class FilteringService {
  getFilterOptions<T extends string>(
    filter: string | undefined,
    allowedFields: readonly T[],
  ): { field: T; value: string } | null {
    if (!filter) {
      return null;
    }

    const [field, ...valueParts] = filter.split(':');
    const value = valueParts.join(':');

    if (!field || !value || !allowedFields.includes(field as T)) {
      throw new BadRequestException(
        'Invalid filter. Filter must be in the format field:value and field must be allowed.',
      );
    }

    return {
      field: field as T,
      value,
    };
  }
}
