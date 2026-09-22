import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import request from 'supertest';
import { UserResponseDto } from 'src/modules/users/dto/user-response.dto.js';
import { configureApp } from './../src/app.setup.js';

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    configureApp(app);

    await app.init();
  });

  it('POST /auth/register - should register a new user', async () => {
    const email = `e2e-${Date.now()}@example.com`;
    const username = `e2e-${Date.now()}`;

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        username,
        firstName: 'Test',
        lastName: 'User',
        password: 'Password123!',
      })
      .expect(201);

    const body = response.body as ApiResponse<UserResponseDto>;

    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
    expect(body.data.email).toBe(email);
    expect(body.data.username).toBe(username);
  });

  afterAll(async () => {
    await app.close();
  });
});
