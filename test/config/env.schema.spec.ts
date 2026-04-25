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
  OPENAI_API_KEY: "sk-test-key",
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

  it("parses rag and openai configuration", () => {
    const env = parseEnv({
      ...validEnv,
      OPENAI_API_KEY: "sk-test-key",
      OPENAI_CHAT_MODEL: "gpt-5-mini",
      OPENAI_EMBEDDING_MODEL: "text-embedding-3-small",
      RAG_TOP_K: "5",
      RAG_MIN_SCORE: "0.72",
      RAG_MAX_CONTEXT_MESSAGES: "8",
      CHAT_ANONYMOUS_SESSION_TTL: "30d",
    });

    expect(env.OPENAI_CHAT_MODEL).toBe("gpt-5-mini");
    expect(env.RAG_TOP_K).toBe(5);
    expect(env.RAG_MIN_SCORE).toBe(0.72);
  });

  it("rejects invalid rag retrieval settings", () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        OPENAI_API_KEY: "sk-test-key",
        RAG_TOP_K: "0",
      }),
    ).toThrow("Invalid environment");

    expect(() =>
      parseEnv({
        ...validEnv,
        OPENAI_API_KEY: "sk-test-key",
        RAG_MIN_SCORE: "2",
      }),
    ).toThrow("Invalid environment");
  });

  it("rejects blank rag numeric settings", () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        RAG_TOP_K: "",
      }),
    ).toThrow("Invalid environment");

    expect(() =>
      parseEnv({
        ...validEnv,
        RAG_MIN_SCORE: "",
      }),
    ).toThrow("Invalid environment");

    expect(() =>
      parseEnv({
        ...validEnv,
        RAG_MAX_CONTEXT_MESSAGES: " ",
      }),
    ).toThrow("Invalid environment");
  });

  it("allows zero rag max context messages", () => {
    const env = parseEnv({
      ...validEnv,
      RAG_MAX_CONTEXT_MESSAGES: "0",
    });

    expect(env.RAG_MAX_CONTEXT_MESSAGES).toBe(0);
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

  it("exposes ai, rag, and chat configuration", () => {
    process.env = {
      ...validEnv,
      OPENAI_API_KEY: "sk-test-key",
      RAG_TOP_K: "7",
      RAG_MIN_SCORE: "0.65",
      RAG_MAX_CONTEXT_MESSAGES: "12",
      CHAT_ANONYMOUS_SESSION_TTL: "14d",
    };

    const config = configuration();

    expect(config.ai).toEqual({
      openAiApiKey: "sk-test-key",
      chatModel: "gpt-5-mini",
      embeddingModel: "text-embedding-3-small",
    });
    expect(config.rag).toEqual({
      topK: 7,
      minScore: 0.65,
      maxContextMessages: 12,
    });
    expect(config.chat).toEqual({
      anonymousSessionTtl: "14d",
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
