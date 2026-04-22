import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { MetricsStore } from './metrics.store';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly store: MetricsStore) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();

    res.on('finish', () => {
      this.store.record(req.method, res.statusCode, Date.now() - start);
    });

    next();
  }
}
