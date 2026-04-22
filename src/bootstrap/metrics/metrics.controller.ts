import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { MetricsStore } from './metrics.store';

@ApiTags('metrics')
@Controller('metrics')
@SkipThrottle()
export class MetricsController {
  constructor(private readonly store: MetricsStore) {}

  @Get()
  @ApiOperation({ summary: 'Get request metrics snapshot' })
  getMetrics() {
    return this.store.snapshot();
  }
}
