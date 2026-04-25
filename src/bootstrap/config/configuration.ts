import { parseEnv } from "./env.schema";

export function configuration() {
  const env = parseEnv(process.env);

  return {
    app: {
      env: env.NODE_ENV,
      port: env.PORT,
      swaggerEnabled: env.SWAGGER_ENABLED,
      corsOrigins: env.CORS_ORIGINS.split(",").map((origin) => origin.trim()),
      runMigrationsOnStartup: env.RUN_MIGRATIONS_ON_STARTUP,
    },
    database: {
      url: env.DATABASE_URL,
    },
    redis: {
      url: env.REDIS_URL,
    },
  };
}
