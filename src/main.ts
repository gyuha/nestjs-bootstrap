import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { bootstrapApplication } from './bootstrap/bootstrap-application';
import { AppConfigService } from './bootstrap/config/app-config.service';

async function main() {
  const app = await NestFactory.create(AppModule);

  await bootstrapApplication(app);

  const appConfigService = app.get(AppConfigService);
  await app.listen(appConfigService.port);
}

void main();
