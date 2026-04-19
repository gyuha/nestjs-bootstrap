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

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithTraceId>();
    const response = context.getResponse<Response>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const traceId =
      request.traceId || String(response.getHeader(TRACE_ID_HEADER) || '');

    response.status(statusCode).json({
      success: false,
      error: this.getErrorMessage(exception),
      meta: { traceId },
    });
  }

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

    return 'Internal server error';
  }
}
