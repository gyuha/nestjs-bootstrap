import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { traceStore } from '../../../bootstrap/logging/trace.middleware';
import { ErrorTrackingService } from '../../infrastructure/monitoring/error-tracking.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(
    @Inject(ErrorTrackingService)
    private readonly errorTracking: ErrorTrackingService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let details: string[] | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const raw = exception.getResponse();

      if (typeof raw === 'string') {
        message = raw;
      } else if (typeof raw === 'object' && raw !== null) {
        const body = raw as Record<string, unknown>;
        const rawMessage = body.message;

        if (Array.isArray(rawMessage)) {
          message = 'Validation failed';
          details = rawMessage as string[];
        } else if (typeof rawMessage === 'string') {
          message = rawMessage;
        }
      }
    } else {
      this.logger.error(
        'Unhandled exception',
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const traceId = traceStore.getStore()?.traceId ?? 'unknown';
    const userId = (request.user as { userId: string } | undefined)?.userId ?? null;

    this.errorTracking.record({
      traceId,
      method: request.method,
      path: request.url,
      statusCode,
      message: String(message),
      timestamp: new Date().toISOString(),
      userId,
      ...(statusCode >= 500 && exception instanceof Error
        ? { stack: exception.stack }
        : {}),
    });

    response.status(statusCode).json({
      success: false,
      error: {
        statusCode,
        message,
        ...(details && details.length > 0 ? { details } : {}),
      },
      timestamp: new Date().toISOString(),
    });
  }
}
