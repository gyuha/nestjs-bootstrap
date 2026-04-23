/**
 * 루트 경로의 비즈니스 로직을 담당하는 서비스.
 *
 * NestJS에서 `@Injectable()` 서비스는 컨트롤러에서 비즈니스 로직을 분리하는 단위입니다.
 * 이 서비스는 환경변수에서 앱 메타데이터를 읽어 반환하고,
 * 현재 요청의 traceId를 가져오는 두 가지 역할을 합니다.
 */
import { Injectable } from '@nestjs/common';

import { AppConfigService } from './bootstrap/config/app-config.service';
import { getTraceId } from './shared/infrastructure/request-context';

/** 루트 엔드포인트가 반환하는 앱 상태 정보의 타입 */
export interface FoundationStatus {
  environment: string;
  name: string;
  version: string;
}

/** 앱 기본 상태 정보를 제공하는 서비스 */
@Injectable()
export class AppService {
  constructor(private readonly appConfigService: AppConfigService) {}

  /** 환경변수에서 앱 이름·버전·실행 환경을 읽어 반환합니다. */
  getFoundationStatus(): FoundationStatus {
    return {
      name: this.appConfigService.appName,
      version: this.appConfigService.appVersion,
      environment: this.appConfigService.nodeEnv,
    };
  }

  /** AsyncLocalStorage에서 현재 요청의 traceId를 가져옵니다. */
  getCurrentTraceId() {
    return getTraceId();
  }
}
