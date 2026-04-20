import {
  Controller,
  Get,
  HttpStatus,
  Res,
  VERSION_NEUTRAL,
  Version,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
// biome-ignore lint/style/useImportType: NestJS DI requires runtime class reference
import { HealthService } from './health.service';

interface HealthResult {
  status: 'ok' | 'degraded';
  db: 'ok' | 'error';
  cache: 'ok' | 'error';
}

@ApiTags('health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Version(VERSION_NEUTRAL)
  @ApiOperation({ summary: '서버 상태 확인 (DB + Cache 포함)' })
  async check(
    @Res({ passthrough: true }) res: Response,
  ): Promise<HealthResult> {
    const [db, cache] = await Promise.all([
      this.healthService.checkDb(),
      this.healthService.checkCache(),
    ]);
    const status = db === 'ok' && cache === 'ok' ? 'ok' : 'degraded';
    if (status === 'degraded') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return { status, db, cache };
  }
}
