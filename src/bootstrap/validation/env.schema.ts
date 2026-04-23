import { z } from 'zod';

/**
 * 환경 변수 유효성 검사 스키마.
 * 필수 설정 누락 또는 잘못된 값이 있을 경우 애플리케이션 시작을 차단한다.
 * 각 필드는 기본값 또는 선택 여부가 명시되어 있다.
 */
export const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.url().optional(),
  JWT_SECRET: z.string().min(32),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  API_BASE_URL: z.url().default('http://localhost:3000'),

  EMAIL_PROVIDER: z.enum(['resend', 'smtp', 'log']).default('log'),
  EMAIL_FROM: z.email().default('noreply@example.com'),

  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./uploads'),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_PUBLIC_URL: z.string().optional(),

  BULL_BOARD_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
});

/** EnvSchema로부터 추론된 환경 변수 타입 */
export type Env = z.infer<typeof EnvSchema>;

/**
 * 주어진 설정 객체를 EnvSchema로 파싱하여 유효성을 검사한다.
 * 유효성 검사 실패 시 상세 오류 메시지를 포함한 Error를 던진다.
 * @param config 검사할 환경 변수 원시 객체
 * @returns 유효성 검사를 통과한 파싱된 Env 객체
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const result = EnvSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${errors}`);
  }
  return result.data;
}
