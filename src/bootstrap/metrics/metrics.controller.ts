import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ErrorTrackingService } from '../../shared/infrastructure/monitoring/error-tracking.service';
import { MetricsStore } from './metrics.store';

/** 애플리케이션 런타임 메트릭을 외부로 노출하는 컨트롤러 */
@ApiTags('metrics')
@Controller('metrics')
@SkipThrottle()
export class MetricsController {
  constructor(
    private readonly store: MetricsStore,
    private readonly errorTracking: ErrorTrackingService,
  ) {}

  /**
   * 현재 요청 메트릭 스냅샷을 반환한다.
   * 업타임, 요청 수, 레이턴시 백분위수, 에러 집계를 포함한다.
   * @returns MetricsSnapshot에 에러 타입별 집계가 병합된 응답 객체
   */
  @Get()
  @ApiOperation({ summary: 'Get request metrics snapshot' })
  getMetrics() {
    const snap = this.store.snapshot();
    return {
      ...snap,
      errors: {
        ...snap.errors,
        byType: this.errorTracking.getSummary(),
      },
    };
  }
}
