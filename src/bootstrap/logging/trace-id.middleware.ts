import { randomUUID } from 'node:crypto';

import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';

import {
  type RequestWithTraceId,
  runWithRequestContext,
} from '../../shared/infrastructure/request-context';
import { TRACE_ID_HEADER } from './trace-id.constants';

@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(request: RequestWithTraceId, response: Response, next: NextFunction) {
    const traceId = this.resolveTraceId(request.headers[TRACE_ID_HEADER]);

    request.traceId = traceId;
    response.setHeader(TRACE_ID_HEADER, traceId);

    runWithRequestContext({ traceId }, next);
  }

  private resolveTraceId(headerValue: string | string[] | undefined) {
    if (typeof headerValue === 'string' && headerValue.length > 0) {
      return headerValue;
    }

    if (Array.isArray(headerValue) && headerValue[0]) {
      return headerValue[0];
    }

    return randomUUID();
  }
}
