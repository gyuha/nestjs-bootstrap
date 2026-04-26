import { z } from "zod";

function booleanFromString(defaultValue: "true" | "false") {
  return z
    .enum(["true", "false"])
    .default(defaultValue)
    .transform((value) => value === "true");
}

const optionalBooleanFromString = z.enum(["true", "false"]).transform((value) => value === "true");

const nonBlankString = z.string().trim().min(1);
function numericEnv<T extends z.ZodType>(schema: T) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
    schema,
  );
}
const tokenDuration = z
  .string()
  .trim()
  .regex(/^\d+[smhd]$/, {
    message: "Expected a duration like 15m, 12h, or 30d",
  });
const duration = tokenDuration;

const corsOrigins = z
  .string()
  .default("http://localhost:3000")
  .transform((value, ctx) => {
    const origins = value.split(",").map((origin) => origin.trim());

    if (origins.some((origin) => origin.length === 0)) {
      ctx.addIssue({
        code: "custom",
        message: "CORS_ORIGINS cannot contain blank entries",
      });

      return z.NEVER;
    }

    if (
      origins.some((origin) => {
        try {
          new URL(origin);
          return false;
        } catch {
          return true;
        }
      })
    ) {
      ctx.addIssue({
        code: "custom",
        message: "CORS_ORIGINS must contain valid URLs",
      });

      return z.NEVER;
    }

    return origins.join(",");
  });

const rawEnvSchema = z
  .object({
    NODE_ENV: z.enum(["local", "test", "staging", "production"]).default("local"),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    CORS_ORIGINS: corsOrigins,
    SWAGGER_ENABLED: optionalBooleanFromString.optional(),
    RUN_MIGRATIONS_ON_STARTUP: booleanFromString("false"),
    JWT_ACCESS_TOKEN_SECRET: z.string().trim().min(32),
    JWT_ACCESS_TOKEN_EXPIRES_IN: tokenDuration.default("15m"),
    REFRESH_TOKEN_EXPIRES_IN: tokenDuration.default("30d"),
    GOOGLE_CLIENT_ID: nonBlankString,
    GOOGLE_CLIENT_SECRET: nonBlankString,
    GOOGLE_CALLBACK_URL: z.string().url(),
    OPENAI_API_KEY: nonBlankString,
    OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
    OPENAI_CHAT_MODEL: nonBlankString.default("gpt-5-mini"),
    OPENAI_EMBEDDING_MODEL: nonBlankString.default("text-embedding-3-small"),
    RAG_TOP_K: numericEnv(z.coerce.number().int().min(1).max(20)).default(5),
    RAG_MIN_SCORE: numericEnv(z.coerce.number().min(0).max(1)).default(0.72),
    RAG_MAX_CONTEXT_MESSAGES: numericEnv(z.coerce.number().int().min(0).max(30)).default(8),
    CHAT_ANONYMOUS_SESSION_TTL: duration.default("30d"),
  })
  .transform((env) => ({
    ...env,
    SWAGGER_ENABLED: env.SWAGGER_ENABLED ?? (env.NODE_ENV === "local" || env.NODE_ENV === "test"),
  }));

export type Env = z.infer<typeof rawEnvSchema>;

export function parseEnv(values: Record<string, unknown>): Env {
  const parsed = rawEnvSchema.safeParse(values);

  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }

  const env = parsed.data;

  if (
    (env.NODE_ENV === "staging" || env.NODE_ENV === "production") &&
    env.RUN_MIGRATIONS_ON_STARTUP
  ) {
    throw new Error("RUN_MIGRATIONS_ON_STARTUP cannot be true in production-like environments");
  }

  return env;
}
