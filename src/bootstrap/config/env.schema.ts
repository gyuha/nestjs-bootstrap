import { z } from "zod";

function booleanFromString(defaultValue: "true" | "false") {
  return z
    .enum(["true", "false"])
    .default(defaultValue)
    .transform((value) => value === "true");
}

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

const rawEnvSchema = z.object({
  NODE_ENV: z.enum(["local", "test", "staging", "production"]).default("local"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  CORS_ORIGINS: corsOrigins,
  SWAGGER_ENABLED: booleanFromString("true"),
  RUN_MIGRATIONS_ON_STARTUP: booleanFromString("false"),
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
