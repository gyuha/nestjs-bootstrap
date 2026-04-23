import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { MetricsStore } from './metrics.store';

/** HTTP 요청/응답의 메서드·상태 코드·소요 시간을 MetricsStore에 기록하는 미들웨어 */
@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly store: MetricsStore) {}

  /**
   * 응답 `finish` 이벤트를 구독하여 요청 메트릭을 수집한 뒤 다음 미들웨어로 제어를 넘긴다.
   * @param req HTTP 요청 객체
   * @param res HTTP 응답 객체
   * @param next 다음 미들웨어 호출 함수
   */
  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();

    res.on('finish', () => {
      this.store.record(req.method, res.statusCode, Date.now() - start);
    });

    next();
  }
}
