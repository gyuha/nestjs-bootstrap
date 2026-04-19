import { z } from 'zod';

const emptyStringToUndefined = (value: unknown) =>
  typeof value === 'string' && value.length === 0 ? undefined : value;

const optionalNonEmptyString = z.preprocess(
  emptyStringToUndefined,
  z.string().min(1).optional(),
);

const optionalPositiveInt = z.preprocess(
  emptyStringToUndefined,
  z.coerce.number().int().positive().optional(),
);

export const appConfigSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    APP_NAME: z.string().min(1),
    APP_DESCRIPTION: z.string().min(1),
    APP_VERSION: z.string().min(1),
    APP_CORS_ORIGIN: z.string().min(1),
    DB_DRIVER: z.enum(['postgres', 'sqlite']),
    DATABASE_URL: z.string().default(''),
    POSTGRES_HOST: optionalNonEmptyString,
    POSTGRES_PORT: optionalPositiveInt,
    POSTGRES_USER: optionalNonEmptyString,
    POSTGRES_PASSWORD: z.string().default(''),
    POSTGRES_DB: optionalNonEmptyString,
    SQLITE_PATH: z.string().default(''),
    DATABASE_MIGRATIONS_DIR: z.string().default(''),
    REDIS_HOST: z.string().min(1),
    REDIS_PORT: z.coerce.number().int().positive(),
    REDIS_PASSWORD: z.string(),
    REDIS_DB: z.coerce.number().int().min(0),
    REDIS_KEY_PREFIX: z.string(),
    HEALTH_CACHE_KEY: z.string().min(1),
  })
  .superRefine((config, context) => {
    if (config.DB_DRIVER === 'sqlite') {
      const hasSqlitePath = config.SQLITE_PATH.length > 0;
      const hasDatabaseUrl = config.DATABASE_URL.length > 0;
      const hasSqliteDatabaseUrl = config.DATABASE_URL.startsWith('file:');

      if (hasDatabaseUrl && !hasSqliteDatabaseUrl) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'DATABASE_URL must use the file: scheme when DB_DRIVER=sqlite',
          path: ['DATABASE_URL'],
        });
      }

      if (!hasSqlitePath && !hasSqliteDatabaseUrl) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'SQLITE_PATH or a sqlite DATABASE_URL is required when DB_DRIVER=sqlite',
          path: hasSqlitePath ? ['SQLITE_PATH'] : ['DATABASE_URL'],
        });
      }

      return;
    }

    if (config.DATABASE_URL.length > 0) {
      return;
    }

    const missingPostgresTupleFields = [
      ['POSTGRES_HOST', config.POSTGRES_HOST],
      ['POSTGRES_PORT', config.POSTGRES_PORT],
      ['POSTGRES_USER', config.POSTGRES_USER],
      ['POSTGRES_DB', config.POSTGRES_DB],
    ] as const;

    for (const [field, value] of missingPostgresTupleFields) {
      if (value === undefined || value === '') {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${field} is required when DB_DRIVER=postgres and DATABASE_URL is blank`,
          path: [field],
        });
      }
    }
  });

export type AppConfig = z.infer<typeof appConfigSchema>;
