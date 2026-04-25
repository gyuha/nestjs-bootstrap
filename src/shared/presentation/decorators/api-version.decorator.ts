import { VersioningType, type INestApplication } from "@nestjs/common";

export const API_VERSION = "1";
export const API_VERSION_PREFIX = `api/v${API_VERSION}`;

export function setupApiVersioning(app: INestApplication): void {
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: API_VERSION,
  });
}
