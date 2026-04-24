import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';
import type { HttpRequestWithTrace } from '../types/http-request-with-trace';

export const TRACE_ID_HEADER = 'x-trace-id';

export function traceIdMiddleware(
  request: HttpRequestWithTrace,
  response: Response,
  next: NextFunction,
): void {
  const headerValue = request.header(TRACE_ID_HEADER);
  const traceId = headerValue && headerValue.trim().length > 0 ? headerValue : randomUUID();

  request.traceId = traceId;
  response.setHeader(TRACE_ID_HEADER, traceId);
  next();
}
