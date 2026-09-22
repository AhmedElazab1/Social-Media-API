import type { Role } from '../generated/prisma/enums.js';

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      role: Role;
    }
  }
}
