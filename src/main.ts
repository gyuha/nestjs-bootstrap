/**
 * 애플리케이션 진입점(entry point).
 *
 * NestJS 앱은 여기서 시작됩니다. `NestFactory.create(AppModule)`로
 * 앱 인스턴스를 생성하고, 미들웨어·보안·Swagger 등 초기 설정을 마친 뒤
 * 지정된 포트에서 HTTP 요청을 수신합니다.
 *
 * 포트 등 설정값은 환경변수에서 읽어오며, `AppConfigService`를 통해 접근합니다.
 * 서버 시작 포트를 바꾸려면 `.env`의 `PORT` 값을 수정하세요.
 */
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { bootstrapApplication } from './bootstrap/bootstrap-application';
import { AppConfigService } from './bootstrap/config/app-config.service';

/** 앱 인스턴스를 생성하고 공통 설정을 적용한 뒤 지정된 포트에서 서버를 시작합니다. */
async function main() {
  const app = await NestFactory.create(AppModule);

  await bootstrapApplication(app);

  const appConfigService = app.get(AppConfigService);
  await app.listen(appConfigService.port);
}

void main();
