import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  DATABASE_URL: z.string().min(1, 'Invalid database url'),

  PORT: z.string().min(1, 'Invalid port').default('3000'),

  JWT_SECRET: z.string().min(1, 'Invalid jwt secret'),
  JWT_EXP: z.string().default('15m'),

  JWT_REFRESH_SECRET: z.string().min(1, 'Invalid jwt refresh secret'),
  JWT_REFRESH_EXP: z.string().default('7d'),
});
