import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { applyBootstrap } from "./bootstrap/apply-bootstrap";
import { runStartupMigrations } from "./shared/infrastructure/database/startup-migrations";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  applyBootstrap(app);

  const config = app.get(ConfigService);
  await runStartupMigrations(config);
  await app.listen(config.get<number>("app.port", 3000));
}

void bootstrap();
