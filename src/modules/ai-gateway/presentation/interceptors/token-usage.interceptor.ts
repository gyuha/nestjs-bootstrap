import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Optional,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggingService } from '../../../monitoring/application/services/logging.service';
import { MetricsService } from '../../../monitoring/application/services/metrics.service';

@Injectable()
export class TokenUsageInterceptor implements NestInterceptor {
  constructor(
    @Optional() private readonly loggingService?: LoggingService,
    @Optional() private readonly metricsService?: MetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const path = request.route?.path || url;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (response) => {
        const latencyMs = Date.now() - startTime;
        const traceId = response?.traceId ?? crypto.randomUUID();

        const usage = response?.data?.usage;
        if (usage && this.metricsService) {
          await this.metricsService.recordTokenUsage({
            traceId,
            userId: request.user?.id,
            ...usage,
            provider: response.data.provider,
            model: response.data.model,
          });
        }

        if (this.loggingService) {
          await this.loggingService.log({
            traceId,
            sessionId: request.body?.sessionId,
            userId: request.user?.id,
            method,
            path,
            statusCode: response?.statusCode ?? 200,
            latencyMs,
            provider: response?.data?.provider,
            model: response?.data?.model,
            useRag: request.body?.useRag ?? false,
          });
        }
      }),
    );
  }
}
