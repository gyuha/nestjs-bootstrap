import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum NodeEnvironment {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

class EnvironmentVariables {
  @IsEnum(NodeEnvironment)
  NODE_ENV!: NodeEnvironment;

  @IsString()
  @IsNotEmpty()
  APP_NAME!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  APP_PORT!: number;

  @IsString()
  @IsNotEmpty()
  API_PREFIX!: string;

  @IsString()
  @IsNotEmpty()
  API_VERSION!: string;

  @IsBoolean()
  SWAGGER_ENABLED!: boolean;

  @IsString()
  @IsNotEmpty()
  SWAGGER_PATH!: string;

  @IsBoolean()
  CORS_ENABLED!: boolean;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGIN!: string;

  @IsInt()
  @Min(1)
  RATE_LIMIT_TTL_SECONDS!: number;

  @IsInt()
  @Min(1)
  RATE_LIMIT_MAX!: number;
}

function parseBooleanEnvironmentValue(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

export type AppConfig = {
  nodeEnv: NodeEnvironment;
  appName: string;
  port: number;
  apiPrefix: string;
  apiVersion: string;
  swagger: {
    enabled: boolean;
    path: string;
  };
  security: {
    cors: {
      enabled: boolean;
      origin: string | string[];
    };
    rateLimit: {
      ttlSeconds: number;
      max: number;
    };
  };
};

function parseCorsOrigin(value: string | undefined): string | string[] {
  if (!value || value === '*') {
    return '*';
  }

  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (origins.length === 0) {
    throw new Error('CORS_ORIGIN must be "*" or a comma-separated list of origins');
  }

  return origins;
}

export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    {
      ...config,
      SWAGGER_ENABLED: parseBooleanEnvironmentValue(config.SWAGGER_ENABLED),
      CORS_ENABLED: parseBooleanEnvironmentValue(config.CORS_ENABLED),
    },
    {
      enableImplicitConversion: true,
    },
  );

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  parseCorsOrigin(validatedConfig.CORS_ORIGIN);

  return validatedConfig;
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV as NodeEnvironment,
  appName: process.env.APP_NAME ?? 'nestjs-bootstrap',
  port: Number(process.env.APP_PORT ?? 3000),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  apiVersion: process.env.API_VERSION ?? '1',
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
    path: process.env.SWAGGER_PATH ?? 'docs',
  },
  security: {
    cors: {
      enabled: process.env.CORS_ENABLED === 'true',
      origin: parseCorsOrigin(process.env.CORS_ORIGIN),
    },
    rateLimit: {
      ttlSeconds: Number(process.env.RATE_LIMIT_TTL_SECONDS ?? 60),
      max: Number(process.env.RATE_LIMIT_MAX ?? 100),
    },
  },
});
