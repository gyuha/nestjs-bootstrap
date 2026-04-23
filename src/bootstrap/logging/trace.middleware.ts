import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/** 요청 범위의 트레이스 ID를 비동기 컨텍스트 전반에서 공유하기 위한 AsyncLocalStorage 인스턴스 */
export const traceStore = new AsyncLocalStorage<{ traceId: string }>();

/** 각 HTTP 요청에 고유한 트레이스 ID를 부여하고 로그에 포함시키는 미들웨어 */
@Injectable()
export class TraceMiddleware implements NestMiddleware {
  /**
   * HTTP 요청의 `X-Trace-Id` 헤더를 읽거나 새로 생성하여 응답 헤더에 설정하고,
   * AsyncLocalStorage 컨텍스트에 저장한 뒤 다음 미들웨어로 제어를 넘긴다.
   * @param req HTTP 요청 객체
   * @param res HTTP 응답 객체
   * @param next 다음 미들웨어 호출 함수
   */
  use(req: Request, res: Response, next: NextFunction): void {
    const traceId =
      (req.headers['x-trace-id'] as string | undefined) ?? randomUUID();
    res.setHeader('X-Trace-Id', traceId);
    traceStore.run({ traceId }, () => next());
  }
}
