import { Controller, Dependencies, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  GetHealthStatusUseCase,
  type HealthStatus,
} from '../application/get-health-status.use-case';

@ApiTags('health')
@Controller({
  path: 'health',
  version: VERSION_NEUTRAL,
})
@Dependencies(GetHealthStatusUseCase)
export class HealthController {
  constructor(private readonly getHealthStatus: GetHealthStatusUseCase) {}

  @Get()
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
          },
          required: ['status'],
        },
        meta: {
          type: 'object',
          properties: {
            traceId: { type: 'string', example: '018f4f6f-55f2-77c0-8b07-b44c3b6f94d5' },
          },
          required: ['traceId'],
        },
      },
      required: ['data', 'meta'],
    },
  })
  getHealth(): HealthStatus {
    return this.getHealthStatus.execute();
  }
}
