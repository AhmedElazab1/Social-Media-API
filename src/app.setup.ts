import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { AllExceptionsFilter } from './common/filter/all-exceptions.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';

export function configureApp(app: INestApplication): void {
  app.use(cookieParser());

  app.useGlobalInterceptors(new ResponseInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
}
