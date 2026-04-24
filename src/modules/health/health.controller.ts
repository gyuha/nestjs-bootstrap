import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { HealthService } from './health.service';

interface ReadinessResult {
  status: 'ok' | 'degraded';
  db: 'ok' | 'error';
  cache: 'ok' | 'error';
  queue: 'ok' | 'error';
  storage: 'ok' | 'error';
}

@ApiTags('health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe — is this process responsive?' })
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe — are all dependencies healthy?',
  })
  async ready(
    @Res({ passthrough: true }) res: Response,
  ): Promise<ReadinessResult> {
    const [db, cache, _redis, queue, storage] = await Promise.all([
      this.healthService.checkDb(),
      this.healthService.checkCache(),
      this.healthService.checkRedis(),
      this.healthService.checkQueue(),
      this.healthService.checkStorage(),
    ]);

    const status =
      db === 'ok' && cache === 'ok' && queue === 'ok' && storage === 'ok'
        ? 'ok'
        : 'degraded';

    if (status === 'degraded') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return { status, db, cache, queue, storage };
  }
}
