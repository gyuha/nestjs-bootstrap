import {
  type ExceptionFilter,
  Catch,
  type ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ErrorResponseDto } from '../dto/response-envelope.dto';

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const traceId = (request as any).traceId || 'unknown';
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const code =
      exception instanceof HttpException
        ? (exception.getResponse() as any)?.code || this.getDefaultCode(status)
        : 'INTERNAL_ERROR';

    const message =
      exception instanceof HttpException
        ? (exception.getResponse() as any)?.message || exception.message
        : 'Internal server error';

    this.logger.error(`[${traceId}] ${status} ${code} ${message}`, (exception as any).stack);

    const errorResponse: ErrorResponseDto = {
      error: { code, message, details: {} },
      meta: { traceId },
    };

    response.status(status).json(errorResponse);
  }

  private getDefaultCode(status: number): string {
    switch (status) {
      case 400: return 'VALIDATION_ERROR';
      case 401: return 'AUTH_UNAUTHORIZED';
      case 403: return 'AUTH_FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 500: return 'INTERNAL_ERROR';
      default: return 'INTERNAL_ERROR';
    }
  }
}