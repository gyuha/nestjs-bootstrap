process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.PORT = process.env.PORT ?? "3001";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/nestjs_bootstrap_test";
process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS ?? "http://localhost:3000";
process.env.SWAGGER_ENABLED = process.env.SWAGGER_ENABLED ?? "false";
process.env.RUN_MIGRATIONS_ON_STARTUP = process.env.RUN_MIGRATIONS_ON_STARTUP ?? "true";
