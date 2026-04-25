import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './bootstrap/swagger/setup';
import { setupValidation } from './bootstrap/validation/setup';
import { setupSecurity } from './bootstrap/security/setup';
import { setupLogging } from './bootstrap/logging/setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupLogging(app);
  setupSecurity(app);
  setupValidation(app);
  setupSwagger(app);

  await app.listen(3000);
}
bootstrap();