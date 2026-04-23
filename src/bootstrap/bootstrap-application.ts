/**
 * NestJS 앱 인스턴스에 공통 설정을 적용하는 함수.
 *
 * `main.ts`에서 앱 생성 직후 호출됩니다. 실행 순서가 중요합니다:
 * 1. 미들웨어 등록 (traceId → 요청 로거 순)
 * 2. 글로벌 URL 프리픽스(`/api`) 설정
 * 3. 보안 헤더·CORS 설정
 * 4. 입력값 유효성 검사 파이프 등록
 * 5. URI 기반 API 버전 관리 활성화 (기본 v1)
 * 6. 전역 예외 필터 등록
 * 7. Swagger 문서 노출 (프로덕션 환경 제외)
 *
 * 새로운 전역 미들웨어·가드·인터셉터를 추가하려면 이 파일을 수정하세요.
 */
import { type INestApplication, VersioningType } from '@nestjs/common';

import { GlobalExceptionFilter } from '../shared/presentation/global-exception.filter';
import { AppConfigService } from './config/app-config.service';
import { RequestLoggerMiddleware } from './logging/request-logger.middleware';
import { TraceIdMiddleware } from './logging/trace-id.middleware';
import { setupSecurity } from './security/setup-security';
import { setupSwagger } from './swagger/setup-swagger';
import { setupValidation } from './validation/setup-validation';

/** NestJS 앱 인스턴스에 미들웨어·보안·검증·문서화 설정을 순서대로 적용합니다. */
export async function bootstrapApplication(app: INestApplication) {
  const appConfigService = app.get(AppConfigService);
  const traceIdMiddleware = new TraceIdMiddleware();
  const requestLoggerMiddleware = new RequestLoggerMiddleware();

  // traceId를 먼저 부여해야 이후 로거에서 traceId를 읽을 수 있습니다.
  app.use(traceIdMiddleware.use.bind(traceIdMiddleware));
  app.use(requestLoggerMiddleware.use.bind(requestLoggerMiddleware));
  app.setGlobalPrefix('api');
  setupSecurity(app);
  setupValidation(app);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger는 개발·스테이징 환경에서만 노출합니다.
  if (appConfigService.nodeEnv !== 'production') {
    setupSwagger(app);
  }
}
