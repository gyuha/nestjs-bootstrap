/**
 * 환경변수 유효성 검증 스키마 (Zod).
 *
 * 앱 시작 시 `process.env`를 이 스키마로 파싱합니다. 필수값이 빠지거나 형식이 틀리면
 * 즉시 오류를 발생시켜 잘못된 설정으로 앱이 실행되는 것을 막습니다.
 * `superRefine`을 사용해 DB 드라이버 선택에 따른 조건부 필수 필드를 검증합니다.
 *
 * 새로운 환경변수를 추가하려면 이 스키마의 `z.object()` 안에 필드를 추가하세요.
 */
import { z } from 'zod';

/** 빈 문자열("")을 undefined로 변환하는 전처리 함수 — 선택적 환경변수에 사용 */
const emptyStringToUndefined = (value: unknown) =>
  typeof value === 'string' && value.length === 0 ? undefined : value;

/** 빈 문자열을 허용하지 않는 선택적 문자열 타입 */
const optionalNonEmptyString = z.preprocess(
  emptyStringToUndefined,
  z.string().min(1).optional(),
);

/** 빈 문자열을 허용하지 않는 선택적 양의 정수 타입 */
const optionalPositiveInt = z.preprocess(
  emptyStringToUndefined,
  z.coerce.number().int().positive().optional(),
);

/** 전체 환경변수 유효성 검증 스키마 */
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
    // sqlite 드라이버 선택 시: SQLITE_PATH 또는 file: 접두사가 붙은 DATABASE_URL 필요
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

    // postgres 드라이버 선택 시: DATABASE_URL 또는 개별 접속 정보(host·port·user·db) 필요
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

/** 검증된 환경변수 객체의 TypeScript 타입 */
export type AppConfig = z.infer<typeof appConfigSchema>;
