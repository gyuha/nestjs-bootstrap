import { describe, expect, it } from "vitest";
import { parseEnv } from "../../src/bootstrap/config/env.schema";

const validEnv = {
  NODE_ENV: "test",
  PORT: "3000",
  DATABASE_URL: "postgres://postgres:postgres@localhost:5432/nestjs_bootstrap_test",
  REDIS_URL: "redis://localhost:6379",
  CORS_ORIGINS: "http://localhost:3000",
  SWAGGER_ENABLED: "true",
  RUN_MIGRATIONS_ON_STARTUP: "true",
};

describe("env schema", () => {
  it("parses a valid environment", () => {
    const env = parseEnv(validEnv);

    expect(env.NODE_ENV).toBe("test");
    expect(env.PORT).toBe(3000);
    expect(env.RUN_MIGRATIONS_ON_STARTUP).toBe(true);
  });

  it("rejects an invalid database url", () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        DATABASE_URL: "not-a-url",
      }),
    ).toThrow("Invalid environment");
  });

  it("rejects startup migrations in production", () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        NODE_ENV: "production",
        RUN_MIGRATIONS_ON_STARTUP: "true",
      }),
    ).toThrow("RUN_MIGRATIONS_ON_STARTUP cannot be true in production");
  });
});
