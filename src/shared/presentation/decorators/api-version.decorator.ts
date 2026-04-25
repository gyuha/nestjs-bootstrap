import { applyVersioning, NestExpressApplication, VersioningType } from '@nestjs/common';

export const API_VERSION = 'v1';
export const API_VERSION_PREFIX = `api/${API_VERSION}`;

export function setupApiVersioning(app: NestExpressApplication): void {
  applyVersioning({
    type: VersioningType.URI,
    prefix: API_VERSION_PREFIX,
    version: API_VERSION,
  });
}