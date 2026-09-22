import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Role } from 'src/generated/prisma/enums.js';
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request: Request = context.switchToHttp().getRequest();

    const user = request.user as {
      userId: string;
      email: string;
      role: Role;
    };

    if (!user) return false;
    return requiredRoles.includes(user.role);
  }
}
