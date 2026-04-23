/**
 * HTTP 요청 완료 시 메서드·경로·상태코드·소요시간·traceId를 JSON으로 기록하는 미들웨어.
 *
 * `response.on('finish')` 이벤트를 사용하는 이유:
 * 응답이 클라이언트에 완전히 전송된 뒤에 실행되므로 최종 상태코드와 소요시간을 정확히 기록할 수 있습니다.
 * NestJS Logger를 사용하므로 NestJS의 로그 레벨 설정(`LogLevel`)과 연동됩니다.
 * 로그 형식을 바꾸려면 `this.logger.log()` 호출 부분을 수정하세요.
 */
import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';

import type { RequestWithTraceId } from '../../shared/infrastructure/request-context';

/** 요청 완료 시 접근 로그를 JSON 형태로 남기는 미들웨어 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);

  use(request: RequestWithTraceId, response: Response, next: NextFunction) {
    const startedAt = Date.now();
    const { method } = request;
    const path = request.originalUrl || request.url;

    // 응답이 완전히 전송된 후에 로그를 기록해 정확한 상태코드와 소요시간을 얻습니다.
    response.on('finish', () => {
      const durationMs = Date.now() - startedAt;

      this.logger.log(
        JSON.stringify({
          method,
          path,
          statusCode: response.statusCode,
          durationMs,
          traceId: request.traceId,
        }),
      );
    });

    next();
  }
}
