import { Controller, Get, VERSION_NEUTRAL, Version } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @Version(VERSION_NEUTRAL)
  @ApiOperation({ summary: '서버 상태 확인' })
  check(): { status: string } {
    return { status: 'ok' };
  }
}
