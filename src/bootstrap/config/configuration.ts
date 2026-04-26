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
    auth: {
      accessTokenSecret: env.JWT_ACCESS_TOKEN_SECRET,
      accessTokenExpiresIn: env.JWT_ACCESS_TOKEN_EXPIRES_IN,
      refreshTokenExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackUrl: env.GOOGLE_CALLBACK_URL,
      },
    },
    ai: {
      openAiApiKey: env.OPENAI_API_KEY,
      openAiBaseUrl: env.OPENAI_BASE_URL,
      chatModel: env.OPENAI_CHAT_MODEL,
      embeddingModel: env.OPENAI_EMBEDDING_MODEL,
    },
    rag: {
      topK: env.RAG_TOP_K,
      minScore: env.RAG_MIN_SCORE,
      maxContextMessages: env.RAG_MAX_CONTEXT_MESSAGES,
    },
    chat: {
      anonymousSessionTtl: env.CHAT_ANONYMOUS_SESSION_TTL,
    },
  };
}
