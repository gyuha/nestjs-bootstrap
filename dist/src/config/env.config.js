"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envConfig = void 0;
const config_1 = require("@nestjs/config");
const env_schema_1 = require("./env.schema");
exports.envConfig = (0, config_1.registerAs)("env", () => {
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
  return env_schema_1.envSchema.parse(raw);
});
//# sourceMappingURL=env.config.js.map
