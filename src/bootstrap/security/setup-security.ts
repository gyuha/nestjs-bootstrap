import type { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";

export function setupSecurity(app: INestApplication) {
  const config = app.get(ConfigService);
  const origins = config.get<string[]>("app.corsOrigins", []);

  app.use(helmet());
  app.enableCors({
    origin: origins,
    credentials: true,
  });
}
