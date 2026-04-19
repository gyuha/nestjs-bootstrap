import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppConfig } from './app-config.schema';

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
}
