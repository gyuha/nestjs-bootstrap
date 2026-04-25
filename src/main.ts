import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { applyBootstrap } from "./bootstrap/apply-bootstrap";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  applyBootstrap(app);

  const config = app.get(ConfigService);
  await app.listen(config.get<number>("app.port", 3000));
}

void bootstrap();
