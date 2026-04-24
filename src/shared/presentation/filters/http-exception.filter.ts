import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApplicationError,
  ApplicationErrorCategory,
} from '../../application/errors/application-error';
import { DomainError, DomainErrorCategory } from '../../domain/errors/domain-error';
import type { ApiErrorBody, ApiErrorResponse } from '../responses/api-response';
import type { HttpRequestWithTrace } from '../types/http-request-with-trace';

const DEFAULT_TRACE_ID = 'unknown';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<HttpRequestWithTrace>();
    const response = http.getResponse<Response>();
    const mapped = mapException(exception);

    response.status(mapped.status).json({
      error: mapped.error,
      meta: {
        traceId: request.traceId ?? DEFAULT_TRACE_ID,
      },
    } satisfies ApiErrorResponse);
  }
}

function mapException(exception: unknown): { status: number; error: ApiErrorBody } {
  if (exception instanceof ApplicationError) {
    return mapApplicationError(exception);
  }

  if (exception instanceof DomainError) {
    return mapDomainError(exception);
  }

  if (exception instanceof HttpException) {
    return mapHttpException(exception);
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    },
  };
}

function mapApplicationError(exception: ApplicationError): { status: number; error: ApiErrorBody } {
  const statusByCategory: Record<ApplicationErrorCategory, number> = {
    [ApplicationErrorCategory.NotFound]: HttpStatus.NOT_FOUND,
    [ApplicationErrorCategory.Conflict]: HttpStatus.CONFLICT,
    [ApplicationErrorCategory.Unauthorized]: HttpStatus.UNAUTHORIZED,
    [ApplicationErrorCategory.Forbidden]: HttpStatus.FORBIDDEN,
  };

  return {
    status: statusByCategory[exception.category],
    error: buildErrorBody(exception),
  };
}

function mapDomainError(exception: DomainError): { status: number; error: ApiErrorBody } {
  const statusByCategory: Record<DomainErrorCategory, number> = {
    [DomainErrorCategory.Validation]: HttpStatus.BAD_REQUEST,
    [DomainErrorCategory.Conflict]: HttpStatus.CONFLICT,
  };

  return {
    status: statusByCategory[exception.category],
    error: buildErrorBody(exception),
  };
}

function mapHttpException(exception: HttpException): { status: number; error: ApiErrorBody } {
  const status = exception.getStatus();
  const response = exception.getResponse();

  if (Array.isArray(response) && status === HttpStatus.BAD_REQUEST) {
    return {
      status,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: response,
      },
    };
  }

  if (typeof response === 'object' && response !== null) {
    const body = response as { error?: string; message?: string | string[] };
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;

    if (Array.isArray(body.message) && status === HttpStatus.BAD_REQUEST) {
      return {
        status,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: body.message,
        },
      };
    }

    return {
      status,
      error: {
        code: toErrorCode(body.error ?? HttpStatus[status] ?? 'HTTP_ERROR'),
        message: message ?? exception.message,
      },
    };
  }

  return {
    status,
    error: {
      code: toErrorCode(HttpStatus[status] ?? 'HTTP_ERROR'),
      message: typeof response === 'string' ? response : exception.message,
    },
  };
}

function buildErrorBody(error: { code: string; message: string; details?: unknown }): ApiErrorBody {
  return {
    code: error.code,
    message: error.message,
    ...(error.details === undefined ? {} : { details: error.details }),
  };
}

function toErrorCode(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();
}
