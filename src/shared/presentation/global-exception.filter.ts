/**
 * 앱 전체에서 발생하는 예외를 잡아 일관된 오류 응답으로 변환하는 필터.
 *
 * NestJS `ExceptionFilter`는 컨트롤러·서비스에서 던져진 예외를 가로채
 * HTTP 응답으로 변환합니다. `@Catch()` 데코레이터에 타입을 지정하지 않으면
 * 모든 예외를 잡습니다.
 *
 * 응답 형태: `{ success: false, error: string, meta: { traceId: string } }`
 * - `HttpException`이면 해당 상태코드를 사용합니다.
 * - 그 외 예외는 500 Internal Server Error로 처리합니다.
 * - traceId는 request 객체 또는 응답 헤더에서 가져옵니다.
 */
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

import { TRACE_ID_HEADER } from '../../bootstrap/logging/trace-id.constants';
import type { RequestWithTraceId } from '../infrastructure/request-context';

/** 모든 예외를 잡아 `{ success: false, error, meta }` 형태로 응답하는 전역 예외 필터 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithTraceId>();
    const response = context.getResponse<Response>();

    // HttpException이면 해당 상태코드 사용, 그 외 예외는 500으로 처리합니다.
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // TraceIdMiddleware가 실행되지 않은 경우를 대비해 헤더에서도 traceId를 시도합니다.
    const traceId =
      request.traceId || String(response.getHeader(TRACE_ID_HEADER) || '');

    response.status(statusCode).json({
      success: false,
      error: this.getErrorMessage(exception),
      meta: { traceId },
    });
  }

  /** 예외 유형에 따라 클라이언트에게 노출할 오류 메시지를 추출합니다. */
  private getErrorMessage(exception: unknown) {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return response;
      }

      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        return response.message;
      }
    }

    // 알 수 없는 예외는 내부 구현을 노출하지 않고 일반 메시지를 반환합니다.
    return 'Internal server error';
  }
}
