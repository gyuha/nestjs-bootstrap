import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

export type HealthResponse = {
  status: 'ok';
};

@ApiTags('health')
@Controller({
  path: 'health',
  version: VERSION_NEUTRAL,
})
export class HealthController {
  @Get()
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
      },
      required: ['status'],
    },
  })
  getHealth(): HealthResponse {
    return { status: 'ok' };
  }
}
