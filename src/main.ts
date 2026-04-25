import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './bootstrap/swagger/setup';
import { setupValidation } from './bootstrap/validation/setup';
import { setupSecurity } from './bootstrap/security/setup';
import { setupLogging } from './bootstrap/logging/setup';
import { EnvService } from './config/env.service';
import { setupApiVersioning } from './shared/presentation/decorators/api-version.decorator';
import { JwtAuthGuard } from './modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/presentation/guards/roles.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env = app.get(EnvService);

  setupApiVersioning(app);
  setupLogging(app);
  setupSecurity(app, env);
  setupValidation(app);
  setupSwagger(app);

  app.useGlobalGuards(app.get(JwtAuthGuard), app.get(RolesGuard));

  await app.listen(3000);
}
bootstrap();