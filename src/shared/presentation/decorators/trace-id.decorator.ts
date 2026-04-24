import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { HttpRequestWithTrace } from '../types/http-request-with-trace';

export const TraceId = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<HttpRequestWithTrace>();
  return request.traceId;
});
