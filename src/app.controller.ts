/**
 * 루트 경로(`GET /api/v1`) 컨트롤러.
 *
 * NestJS에서 `@Controller()`는 HTTP 요청을 받아 서비스로 위임하는 역할을 합니다.
 * 이 컨트롤러는 앱의 기본 상태(이름·버전·환경)를 반환하는 단순한 엔드포인트입니다.
 * 새로운 루트 경로 엔드포인트가 필요할 때 이 파일을 수정하세요.
 */
import { Controller, Get, Version } from '@nestjs/common';

import { AppService } from './app.service';
import { createApiResponse } from './shared/presentation/api-response';

/** `GET /api/v1` 요청을 처리하는 루트 컨트롤러 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** 앱 이름·버전·실행 환경을 반환합니다. */
  @Get()
  @Version('1')
  getRoot() {
    return createApiResponse(this.appService.getFoundationStatus(), {
      traceId: this.appService.getCurrentTraceId(),
    });
  }
}
