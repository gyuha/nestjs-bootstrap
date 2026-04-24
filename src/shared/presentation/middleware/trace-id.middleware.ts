import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';
import type { HttpRequestWithTrace } from '../types/http-request-with-trace';

export const TRACE_ID_HEADER = 'x-trace-id';
const SAFE_TRACE_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;
const MAX_TRACE_ID_LENGTH = 128;

export function traceIdMiddleware(
  request: HttpRequestWithTrace,
  response: Response,
  next: NextFunction,
): void {
  const headerValue = request.header(TRACE_ID_HEADER)?.trim();
  const traceId =
    headerValue &&
    headerValue.length <= MAX_TRACE_ID_LENGTH &&
    SAFE_TRACE_ID_PATTERN.test(headerValue)
      ? headerValue
      : randomUUID();

  request.traceId = traceId;
  response.setHeader(TRACE_ID_HEADER, traceId);
  next();
}
