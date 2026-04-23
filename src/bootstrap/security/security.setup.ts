import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

/**
 * NestJS 앱에 Helmet 보안 헤더와 CORS 정책을 적용하는 설정 함수.
 * `ALLOWED_ORIGINS` 환경변수에 쉼표로 구분된 출처 목록을 사용한다.
 * @param app 설정 대상 NestJS 애플리케이션 인스턴스
 */
export function setupSecurity(app: INestApplication): void {
  app.use(helmet());

  const config = app.get(ConfigService);
  const rawOrigins = config.get<string>(
    'ALLOWED_ORIGINS',
    'http://localhost:3000',
  );
  const allowedOrigins = rawOrigins
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Version',
      'X-Trace-Id',
    ],
    exposedHeaders: ['X-Trace-Id'],
  });
}
