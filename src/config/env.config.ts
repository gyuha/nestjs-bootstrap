import { registerAs } from "@nestjs/config";
import { envSchema } from "./env.schema";

export const envConfig = registerAs("env", () => {
  const raw = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,
    SWAGGER_ENABLED: process.env.SWAGGER_ENABLED,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
  };
  return envSchema.parse(raw);
});
