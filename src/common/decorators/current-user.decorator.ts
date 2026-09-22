import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (data: keyof Express.User | undefined, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();

    if (data) {
      return request.user?.[data];
    }

    return request.user;
  },
);
