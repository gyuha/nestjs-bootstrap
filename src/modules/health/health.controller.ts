/**
 * 시스템 헬스체크 엔드포인트 컨트롤러.
 *
 * 두 개의 엔드포인트를 제공합니다:
 * - `GET /api/v1/health`: 앱이 살아있는지 확인하는 단순 응답 (Liveness probe)
 * - `GET /api/v1/health/details`: DB·Redis 연결 상태를 함께 확인 (Readiness probe)
 *
 * 쿠버네티스나 도커 헬스체크에서 이 엔드포인트를 사용할 수 있습니다.
 * 하나라도 비정상이면 `503 Service Unavailable`을 반환합니다.
 */
import {
  Controller,
  Get,
  ServiceUnavailableException,
  Version,
} from '@nestjs/common';

import { getTraceId } from '../../shared/infrastructure/request-context';
import { createApiResponse } from '../../shared/presentation/api-response';

import { HealthService } from './health.service';

/** `/api/v1/health` 경로의 헬스체크 요청을 처리하는 컨트롤러 */
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /** 앱 프로세스가 정상 실행 중임을 확인하는 단순 응답을 반환합니다. */
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

  /** DB·Redis 연결 상태를 확인하고, 하나라도 비정상이면 503을 반환합니다. */
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
