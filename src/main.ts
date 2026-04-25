import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './bootstrap/swagger/setup';
import { setupValidation } from './bootstrap/validation/setup';
import { setupSecurity } from './bootstrap/security/setup';
import { setupLogging } from './bootstrap/logging/setup';
import { EnvService } from './config/env.service';
import { setupApiVersioning } from './shared/presentation/decorators/api-version.decorator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env = app.get(EnvService);

  setupApiVersioning(app);
  setupLogging(app);
  setupSecurity(app, env);
  setupValidation(app);
  setupSwagger(app);

  await app.listen(3000);
}
bootstrap();