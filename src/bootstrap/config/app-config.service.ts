/**
 * 환경변수에 타입 안전하게 접근하는 서비스.
 *
 * NestJS `ConfigService`를 직접 사용하면 키를 문자열로 지정해야 해서 오타 위험이 있습니다.
 * 이 서비스는 `ConfigService`를 래핑해 각 환경변수를 타입이 명시된 getter로 노출합니다.
 * 새로운 환경변수를 앱에서 사용하려면 이 파일에 getter를 추가하세요.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppConfig } from './app-config.schema';

/** 환경변수를 타입 안전한 getter로 제공하는 서비스 */
@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  get nodeEnv() {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  get port() {
    return this.configService.get('PORT', { infer: true });
  }

  get appName() {
    return this.configService.get('APP_NAME', { infer: true });
  }

  get appDescription() {
    return this.configService.get('APP_DESCRIPTION', { infer: true });
  }

  get appVersion() {
    return this.configService.get('APP_VERSION', { infer: true });
  }

  get appCorsOrigin() {
    return this.configService.get('APP_CORS_ORIGIN', { infer: true });
  }

  get databaseDriver() {
    return this.configService.get('DB_DRIVER', { infer: true });
  }

  get databaseUrl() {
    return this.configService.get('DATABASE_URL', { infer: true });
  }

  get postgresHost() {
    return this.configService.get('POSTGRES_HOST', { infer: true });
  }

  get postgresPort() {
    return this.configService.get('POSTGRES_PORT', { infer: true });
  }

  get postgresUser() {
    return this.configService.get('POSTGRES_USER', { infer: true });
  }

  get postgresPassword() {
    return this.configService.get('POSTGRES_PASSWORD', { infer: true });
  }

  get postgresDb() {
    return this.configService.get('POSTGRES_DB', { infer: true });
  }

  get sqlitePath() {
    return this.configService.get('SQLITE_PATH', { infer: true });
  }

  get databaseMigrationsDir() {
    return this.configService.get('DATABASE_MIGRATIONS_DIR', { infer: true });
  }

  get redisHost() {
    return this.configService.get('REDIS_HOST', { infer: true });
  }

  get redisPort() {
    return this.configService.get('REDIS_PORT', { infer: true });
  }

  get redisPassword() {
    return this.configService.get('REDIS_PASSWORD', { infer: true });
  }

  get redisDb() {
    return this.configService.get('REDIS_DB', { infer: true });
  }

  get redisKeyPrefix() {
    return this.configService.get('REDIS_KEY_PREFIX', { infer: true });
  }

  get healthCacheKey() {
    return this.configService.get('HEALTH_CACHE_KEY', { infer: true });
  }
}
