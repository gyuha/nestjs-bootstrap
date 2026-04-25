import { type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import type { LoggingService } from '../../../monitoring/application/services/logging.service';
import type { MetricsService } from '../../../monitoring/application/services/metrics.service';
export declare class TokenUsageInterceptor implements NestInterceptor {
    private readonly loggingService?;
    private readonly metricsService?;
    constructor(loggingService?: LoggingService | undefined, metricsService?: MetricsService | undefined);
    intercept(context: ExecutionContext, next: CallHandler): import("rxjs").Observable<any>;
}
