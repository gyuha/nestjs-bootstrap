import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

export const traceStore = new AsyncLocalStorage<{ traceId: string }>();

@Injectable()
export class TraceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const traceId =
      (req.headers['x-trace-id'] as string | undefined) ?? randomUUID();
    res.setHeader('X-Trace-Id', traceId);
    traceStore.run({ traceId }, () => next());
  }
}
