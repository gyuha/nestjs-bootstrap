import { z } from 'zod';
export declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "test", "production"]>>;
    PORT: z.ZodDefault<z.ZodString>;
    DATABASE_URL: z.ZodString;
    REDIS_URL: z.ZodString;
    JWT_SECRET: z.ZodString;
    JWT_EXPIRES_IN: z.ZodDefault<z.ZodString>;
    REFRESH_TOKEN_EXPIRES_IN: z.ZodDefault<z.ZodString>;
    SWAGGER_ENABLED: z.ZodDefault<z.ZodEnum<["true", "false"]>>;
    CORS_ORIGIN: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    DATABASE_URL: string;
    NODE_ENV: "development" | "test" | "production";
    PORT: string;
    REDIS_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    REFRESH_TOKEN_EXPIRES_IN: string;
    SWAGGER_ENABLED: "true" | "false";
    CORS_ORIGIN: string;
}, {
    DATABASE_URL: string;
    REDIS_URL: string;
    JWT_SECRET: string;
    NODE_ENV?: "development" | "test" | "production" | undefined;
    PORT?: string | undefined;
    JWT_EXPIRES_IN?: string | undefined;
    REFRESH_TOKEN_EXPIRES_IN?: string | undefined;
    SWAGGER_ENABLED?: "true" | "false" | undefined;
    CORS_ORIGIN?: string | undefined;
}>;
export type EnvConfig = z.infer<typeof envSchema>;
