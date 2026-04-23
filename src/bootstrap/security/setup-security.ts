/**
 * HTTP 보안 헤더와 CORS를 설정하는 함수.
 *
 * `helmet`은 XSS·클릭재킹 등 일반적인 웹 공격을 막는 보안 헤더를 자동으로 추가합니다.
 * CORS 설정은 허용된 출처(`APP_CORS_ORIGIN`)에서 온 요청만 브라우저가 허용하도록 합니다.
 * `exposedHeaders`에 `x-trace-id`를 추가해 브라우저 클라이언트에서도 traceId를 읽을 수 있습니다.
 * 허용 출처를 변경하려면 `.env`의 `APP_CORS_ORIGIN` 값을 수정하세요.
 */
import type { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

import { AppConfigService } from '../config/app-config.service';
import { TRACE_ID_HEADER } from '../logging/trace-id.constants';

/** Helmet 보안 헤더와 CORS를 앱에 적용합니다. */
export function setupSecurity(app: INestApplication) {
  const appConfigService = app.get(AppConfigService);

  app.use(
    helmet({
      // 이미지·폰트 등 크로스 오리진 리소스 로드를 허용합니다.
      crossOriginResourcePolicy: false,
    }),
  );

  app.enableCors({
    credentials: true,
    // 브라우저 JavaScript에서 이 헤더를 읽을 수 있도록 노출합니다.
    exposedHeaders: [TRACE_ID_HEADER],
    origin: appConfigService.appCorsOrigin,
  });
}
