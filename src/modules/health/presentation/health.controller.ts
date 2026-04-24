import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';
// biome-ignore lint/style/useImportType: Nest constructor injection relies on emitted decorator metadata for this class token.
import {
  GetHealthStatusUseCase,
  type HealthStatus,
} from '../application/get-health-status.use-case';

@ApiTags('health')
@Controller({
  path: 'health',
  version: VERSION_NEUTRAL,
})
export class HealthController {
  constructor(private readonly getHealthStatus: GetHealthStatusUseCase) {}

  @Get()
  @ApiHeader({
    name: 'x-trace-id',
    required: false,
    description: 'Optional trace id to reuse in response headers and metadata.',
  })
  @ApiOkResponse({
    headers: {
      'x-trace-id': {
        description: 'Trace id associated with the request.',
        schema: {
          type: 'string',
        },
      },
    },
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok'] },
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
