import type { INestApplication } from "@nestjs/common";
import helmet from "helmet";
import type { EnvService } from "../../config/env.service";

export function setupSecurity(app: INestApplication, env: EnvService): void {
  app.use(helmet());

  app.enableCors({
    origin: env.get("CORS_ORIGIN"),
    credentials: true,
  });
}
