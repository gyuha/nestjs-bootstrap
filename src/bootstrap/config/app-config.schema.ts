import { z } from 'zod';

export const appConfigSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_NAME: z.string().min(1),
  APP_DESCRIPTION: z.string().min(1),
  APP_VERSION: z.string().min(1),
  APP_CORS_ORIGIN: z.string().min(1),
  DB_DRIVER: z.enum(['postgres', 'sqlite']),
  DATABASE_URL: z.string(),
  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: z.coerce.number().int().positive(),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string().min(1),
  SQLITE_PATH: z.string().min(1),
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().positive(),
  REDIS_PASSWORD: z.string(),
});

export type AppConfig = z.infer<typeof appConfigSchema>;
