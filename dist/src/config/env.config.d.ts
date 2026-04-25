export declare const envConfig: (() => {
    DATABASE_URL: string;
    NODE_ENV: "development" | "test" | "production";
    PORT: string;
    REDIS_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    REFRESH_TOKEN_EXPIRES_IN: string;
    SWAGGER_ENABLED: "true" | "false";
    CORS_ORIGIN: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    DATABASE_URL: string;
    NODE_ENV: "development" | "test" | "production";
    PORT: string;
    REDIS_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    REFRESH_TOKEN_EXPIRES_IN: string;
    SWAGGER_ENABLED: "true" | "false";
    CORS_ORIGIN: string;
}>;
