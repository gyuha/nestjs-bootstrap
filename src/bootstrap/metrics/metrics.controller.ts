import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ErrorTrackingService } from '../../shared/infrastructure/monitoring/error-tracking.service';
import { MetricsStore } from './metrics.store';

@ApiTags('metrics')
@Controller('metrics')
@SkipThrottle()
export class MetricsController {
  constructor(
    private readonly store: MetricsStore,
    private readonly errorTracking: ErrorTrackingService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get request metrics snapshot' })
  getMetrics() {
    const snap = this.store.snapshot();
    return {
      ...snap,
      errors: {
        ...snap.errors,
        byType: this.errorTracking.getSummary(),
      },
    };
  }
}
