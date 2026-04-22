import { Injectable, Logger } from '@nestjs/common';

export interface ErrorContext {
  traceId: string;
  method: string;
  path: string;
  statusCode: number;
  message: string;
  timestamp: string;
  userId: string | null;
  stack?: string;
}

@Injectable()
export class ErrorTrackingService {
  private readonly logger = new Logger(ErrorTrackingService.name);
  private readonly histogram: Record<string, number> = {};

  record(ctx: ErrorContext): void {
    const key = `${ctx.statusCode} ${ctx.method} ${ctx.path}`;
    this.histogram[key] = (this.histogram[key] ?? 0) + 1;

    const logData = {
      traceId: ctx.traceId,
      method: ctx.method,
      path: ctx.path,
      statusCode: ctx.statusCode,
      message: ctx.message,
      ...(ctx.userId ? { userId: ctx.userId } : {}),
    };

    if (ctx.statusCode >= 500) {
      this.logger.error({ ...logData, stack: ctx.stack });
    } else {
      this.logger.warn(logData);
    }
  }

  getSummary(): Record<string, number> {
    return { ...this.histogram };
  }
}
