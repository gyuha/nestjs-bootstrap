import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';

export function setupValidation(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
}
