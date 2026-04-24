import type { NextFunction, Response } from 'express';
import type { AppLogger } from '../../infrastructure/logging/app-logger';
import type { HttpRequestWithTrace } from '../types/http-request-with-trace';

export function createRequestLoggingMiddleware(appLogger: AppLogger) {
  return (request: HttpRequestWithTrace, response: Response, next: NextFunction): void => {
    const startedAt = process.hrtime.bigint();

    response.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

      appLogger.logRequest({
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        durationMs: Math.round(durationMs),
        traceId: request.traceId ?? 'unknown',
      });
    });

    next();
  };
}
