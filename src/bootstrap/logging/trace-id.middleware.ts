/**
 * 모든 HTTP 요청에 traceId를 부여하는 미들웨어.
 *
 * NestJS 미들웨어는 요청이 컨트롤러에 도달하기 전에 실행되는 함수입니다.
 * 이 미들웨어는 요청 헤더에 `x-trace-id`가 있으면 재사용하고, 없으면 UUID를 새로 생성합니다.
 * traceId는 요청 객체와 응답 헤더에 저장되고, `AsyncLocalStorage`를 통해
 * 비동기 실행 흐름 전체에서 접근할 수 있습니다.
 * 요청 추적 방식을 바꾸려면 `resolveTraceId` 메서드를 수정하세요.
 */
import { randomUUID } from 'node:crypto';

import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';

import {
  type RequestWithTraceId,
  runWithRequestContext,
} from '../../shared/infrastructure/request-context';
import { TRACE_ID_HEADER } from './trace-id.constants';

/** 요청마다 traceId를 생성하거나 헤더에서 가져와 request 객체와 AsyncLocalStorage에 주입합니다. */
@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(request: RequestWithTraceId, response: Response, next: NextFunction) {
    const traceId = this.resolveTraceId(request.headers[TRACE_ID_HEADER]);

    request.traceId = traceId;
    response.setHeader(TRACE_ID_HEADER, traceId);

    // AsyncLocalStorage에 traceId를 담아 이후 모든 비동기 코드에서 접근 가능하게 합니다.
    runWithRequestContext({ traceId }, next);
  }

  /** 헤더값에서 traceId를 추출합니다. 헤더가 없거나 비어있으면 새 UUID를 생성합니다. */
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
