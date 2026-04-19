import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';

import type { RequestWithTraceId } from '../../shared/infrastructure/request-context';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);

  use(request: RequestWithTraceId, response: Response, next: NextFunction) {
    const startedAt = Date.now();
    const { method } = request;
    const path = request.originalUrl || request.url;

    response.on('finish', () => {
      const durationMs = Date.now() - startedAt;

      this.logger.log(
        JSON.stringify({
          method,
          path,
          statusCode: response.statusCode,
          durationMs,
          traceId: request.traceId,
        }),
      );
    });

    next();
  }
}
