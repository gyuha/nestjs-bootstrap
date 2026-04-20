import { Controller, Get, VERSION_NEUTRAL, Version } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  @Get()
  // VERSION_NEUTRAL: health check must be reachable regardless of X-API-Version header value
  @Version(VERSION_NEUTRAL)
  @ApiOperation({ summary: '서버 상태 확인' })
  check(): { status: string } {
    return { status: 'ok' };
  }
}
