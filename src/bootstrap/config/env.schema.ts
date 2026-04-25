import { z } from "zod";

const booleanFromString = z.enum(["true", "false"]).transform((value) => value === "true");

const rawEnvSchema = z.object({
  NODE_ENV: z.enum(["local", "test", "staging", "production"]).default("local"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  SWAGGER_ENABLED: booleanFromString.default("true"),
  RUN_MIGRATIONS_ON_STARTUP: booleanFromString.default("false"),
});

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
