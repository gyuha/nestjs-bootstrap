import { type INestApplication, VersioningType } from "@nestjs/common";
import { setupSecurity } from "./security/setup-security";
import { setupSwagger } from "./swagger/setup-swagger";
import { setupValidation } from "./validation/setup-validation";

export function applyBootstrap(app: INestApplication) {
  app.setGlobalPrefix("api");
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  setupSecurity(app);
  setupValidation(app);
  setupSwagger(app);
}
