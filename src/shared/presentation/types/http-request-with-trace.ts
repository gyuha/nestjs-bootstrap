import type { Request } from 'express';

export type HttpRequestWithTrace = Request & {
  traceId?: string;
};
