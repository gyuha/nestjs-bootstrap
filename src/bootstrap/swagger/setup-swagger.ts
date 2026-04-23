/**
 * Swagger API 문서를 설정하고 `/api/docs` 경로에 노출하는 함수.
 *
 * `@nestjs/swagger`는 컨트롤러·DTO의 데코레이터를 분석해 OpenAPI 문서를 자동 생성합니다.
 * 문서 제목·설명·버전은 환경변수에서 읽어옵니다.
 * JSON 형식의 스펙은 `/api/docs/json`에서 확인할 수 있습니다.
 * 이 함수는 프로덕션 환경에서는 호출되지 않습니다(`bootstrap-application.ts` 참고).
 */
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppConfigService } from '../config/app-config.service';

/** Swagger 문서를 생성하고 `/api/docs` 경로에 마운트합니다. */
export function setupSwagger(app: INestApplication) {
  const appConfigService = app.get(AppConfigService);

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle(appConfigService.appName)
      .setDescription(appConfigService.appDescription)
      .setVersion(appConfigService.appVersion)
      .build(),
  );

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
    // 글로벌 프리픽스(`/api`)를 포함한 경로로 문서를 생성합니다.
    useGlobalPrefix: true,
  });
}
