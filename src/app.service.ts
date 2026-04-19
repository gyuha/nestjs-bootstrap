import { Injectable } from '@nestjs/common';

import { AppConfigService } from './bootstrap/config/app-config.service';
import { getTraceId } from './shared/infrastructure/request-context';

export interface FoundationStatus {
  environment: string;
  name: string;
  version: string;
}

@Injectable()
export class AppService {
  constructor(private readonly appConfigService: AppConfigService) {}

  getFoundationStatus(): FoundationStatus {
    return {
      name: this.appConfigService.appName,
      version: this.appConfigService.appVersion,
      environment: this.appConfigService.nodeEnv,
    };
  }

  getCurrentTraceId() {
    return getTraceId();
  }
}
