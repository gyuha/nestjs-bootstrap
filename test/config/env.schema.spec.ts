import { afterEach, describe, expect, it } from "vitest";
import { configuration } from "../../src/bootstrap/config/configuration";
import { parseEnv } from "../../src/bootstrap/config/env.schema";

const authEnv = {
  JWT_ACCESS_TOKEN_SECRET: "test-access-secret-that-is-at-least-32-characters",
  GOOGLE_CLIENT_ID: "google-client-id",
  GOOGLE_CLIENT_SECRET: "google-client-secret",
  GOOGLE_CALLBACK_URL: "http://localhost:3000/api/v1/auth/google/callback",
};

const baseEnv = {
  NODE_ENV: "test",
  PORT: "3000",
  DATABASE_URL: "postgres://postgres:postgres@localhost:5432/nestjs_bootstrap_test",
  REDIS_URL: "redis://localhost:6379",
  CORS_ORIGINS: "http://localhost:3000",
  SWAGGER_ENABLED: "true",
  RUN_MIGRATIONS_ON_STARTUP: "true",
};

const validEnv = {
  ...baseEnv,
  ...authEnv,
};

const originalEnv = process.env;

describe("env schema", () => {
  afterEach(() => {
    process.env = originalEnv;
  });

  it("parses a valid environment", () => {
    const env = parseEnv(validEnv);

    expect(env.NODE_ENV).toBe("test");
    expect(env.PORT).toBe(3000);
    expect(env.SWAGGER_ENABLED).toBe(true);
    expect(env.CORS_ORIGINS).toBe("http://localhost:3000");
    expect(env.RUN_MIGRATIONS_ON_STARTUP).toBe(true);
  });

  it("defaults swagger to enabled in local and test", () => {
    const localEnv = parseEnv({
      ...validEnv,
      NODE_ENV: "local",
      SWAGGER_ENABLED: undefined,
    });
    const testEnv = parseEnv({
      ...validEnv,
      NODE_ENV: "test",
      SWAGGER_ENABLED: undefined,
    });

    expect(localEnv.SWAGGER_ENABLED).toBe(true);
    expect(testEnv.SWAGGER_ENABLED).toBe(true);
  });

  it("defaults swagger to disabled in production-like environments", () => {
    const stagingEnv = parseEnv({
      ...validEnv,
      NODE_ENV: "staging",
      SWAGGER_ENABLED: undefined,
      RUN_MIGRATIONS_ON_STARTUP: "false",
    });
    const productionEnv = parseEnv({
      ...validEnv,
      NODE_ENV: "production",
      SWAGGER_ENABLED: undefined,
      RUN_MIGRATIONS_ON_STARTUP: "false",
    });

    expect(stagingEnv.SWAGGER_ENABLED).toBe(false);
    expect(productionEnv.SWAGGER_ENABLED).toBe(false);
  });

  it("parses comma-separated cors origins", () => {
    const env = parseEnv({
      ...validEnv,
      CORS_ORIGINS: "http://localhost:3000,https://example.com",
    });

    expect(env.CORS_ORIGINS).toBe("http://localhost:3000,https://example.com");
  });

  it("parses auth configuration defaults", () => {
    const env = parseEnv({
      ...validEnv,
      ...authEnv,
    });

    expect(env.JWT_ACCESS_TOKEN_EXPIRES_IN).toBe("15m");
    expect(env.REFRESH_TOKEN_EXPIRES_IN).toBe("30d");
  });

  it("requires jwt and google oauth secrets", () => {
    expect(() => parseEnv(baseEnv)).toThrow("Invalid environment");
  });

  it("rejects whitespace-only auth secrets", () => {
    const whitespaceSecretEnv = {
      ...validEnv,
      JWT_ACCESS_TOKEN_SECRET: " ".repeat(32),
      GOOGLE_CLIENT_ID: " ",
      GOOGLE_CLIENT_SECRET: " ",
    };

    expect(() => parseEnv(whitespaceSecretEnv)).toThrow("Invalid environment");
  });

  it("rejects blank token expiry values", () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        JWT_ACCESS_TOKEN_EXPIRES_IN: " ",
      }),
    ).toThrow("Invalid environment");

    expect(() =>
      parseEnv({
        ...validEnv,
        REFRESH_TOKEN_EXPIRES_IN: "",
      }),
    ).toThrow("Invalid environment");
  });

  it("rejects unsupported token expiry formats", () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        JWT_ACCESS_TOKEN_EXPIRES_IN: "15 minutes",
      }),
    ).toThrow("Invalid environment");

    expect(() =>
      parseEnv({
        ...validEnv,
        REFRESH_TOKEN_EXPIRES_IN: "30days",
      }),
    ).toThrow("Invalid environment");
  });

  it("exposes auth configuration", () => {
    process.env = {
      ...validEnv,
      JWT_ACCESS_TOKEN_EXPIRES_IN: "10m",
      REFRESH_TOKEN_EXPIRES_IN: "14d",
    };

    expect(configuration().auth).toEqual({
      accessTokenSecret: authEnv.JWT_ACCESS_TOKEN_SECRET,
      accessTokenExpiresIn: "10m",
      refreshTokenExpiresIn: "14d",
      google: {
        clientId: authEnv.GOOGLE_CLIENT_ID,
        clientSecret: authEnv.GOOGLE_CLIENT_SECRET,
        callbackUrl: authEnv.GOOGLE_CALLBACK_URL,
      },
    });
  });

  it("trims comma-separated cors origins", () => {
    const env = parseEnv({
      ...validEnv,
      CORS_ORIGINS: " http://localhost:3000, https://example.com ",
    });

    expect(env.CORS_ORIGINS).toBe("http://localhost:3000,https://example.com");
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

  it("rejects startup migrations in staging", () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        NODE_ENV: "staging",
        RUN_MIGRATIONS_ON_STARTUP: "true",
      }),
    ).toThrow("RUN_MIGRATIONS_ON_STARTUP cannot be true in production");
  });

  it("rejects invalid cors origins", () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        CORS_ORIGINS: "http://localhost:3000,not-a-url",
      }),
    ).toThrow("CORS_ORIGINS must contain valid URLs");
  });

  it("rejects blank cors origin entries", () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        CORS_ORIGINS: "http://localhost:3000,",
      }),
    ).toThrow("CORS_ORIGINS cannot contain blank entries");
  });
});
