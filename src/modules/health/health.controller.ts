import {
  Controller,
  Get,
  ServiceUnavailableException,
  Version,
} from '@nestjs/common';

import { getTraceId } from '../../shared/infrastructure/request-context';
import { createApiResponse } from '../../shared/presentation/api-response';

import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Version('1')
  getHealth() {
    return createApiResponse(
      { status: 'ok' },
      {
        traceId: getTraceId(),
      },
    );
  }

  @Get('details')
  @Version('1')
  async getDetails() {
    const details = await this.healthService.getDetails();

    if (Object.values(details).some((isHealthy) => !isHealthy)) {
      throw new ServiceUnavailableException('Readiness check failed');
    }

    return createApiResponse(details, {
      traceId: getTraceId(),
    });
  }
}
