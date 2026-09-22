import { Role } from 'src/generated/prisma/enums.js';

export const USER_FILTER_FIELDS = [
  'email',
  'username',
  'firstName',
  'lastName',
  'role',
] as const;

export type UserFilterField = (typeof USER_FILTER_FIELDS)[number];

export const USER_ROLES = Object.values(Role);
