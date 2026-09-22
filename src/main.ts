import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    abortOnError: false,
  });

  configureApp(app);

  const configService = app.get(ConfigService);

  const config = new DocumentBuilder()
    .setTitle('Social Media API')
    .setDescription('Social Media API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('refreshToken')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);

  await app.listen(configService.getOrThrow<string>('PORT'));
}

void bootstrap();
