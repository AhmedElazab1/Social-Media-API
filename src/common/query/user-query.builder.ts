import { BadRequestException } from '@nestjs/common';

import { Role } from '../../generated/prisma/client.js';
import type { UserFilterField } from '../../modules/users/constants/user-filter-fields.js';
import { USER_ROLES } from '../../modules/users/constants/user-filter-fields.js';

export class UserQueryBuilder {
  static buildFilterWhere(filterOptions: {
    field: UserFilterField;
    value: string;
  }) {
    if (filterOptions.field === 'role') {
      if (!USER_ROLES.includes(filterOptions.value as Role)) {
        throw new BadRequestException('Invalid role');
      }

      return {
        role: filterOptions.value as Role,
      };
    }

    return {
      [filterOptions.field]: {
        contains: filterOptions.value,
        mode: 'insensitive' as const,
      },
    };
  }

  static buildSearchWhere(searchTerm: string) {
    return {
      OR: [
        {
          username: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        {
          email: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        {
          firstName: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        {
          lastName: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
      ],
    };
  }
}
