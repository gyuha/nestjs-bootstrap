/**
 * DB·Redis 연결 상태를 집계해 전체 시스템 헬스를 판단하는 서비스.
 *
 * 각 인프라 헬스 서비스에 ping을 보내고 결과를 모아 반환합니다.
 * `Promise.all`로 병렬 실행해 전체 체크 시간을 최소화합니다.
 * 새로운 헬스체크 항목(예: 외부 API)을 추가하려면 `HealthDetails` 인터페이스와
 * `getDetails` 메서드를 함께 수정하세요.
 */
import { Injectable } from '@nestjs/common';

import { CacheHealthService } from '../../shared/infrastructure/cache/cache-health.service';
import { DatabaseHealthService } from '../../shared/infrastructure/database/database-health.service';

/** 헬스체크 결과의 타입 — 각 항목이 정상이면 true */
export interface HealthDetails {
  cache: boolean;
  database: boolean;
}

/** 캐시(Redis)와 데이터베이스의 헬스 상태를 병렬로 확인하는 서비스 */
@Injectable()
export class HealthService {
  constructor(
    private readonly cacheHealthService: CacheHealthService,
    private readonly databaseHealthService: DatabaseHealthService,
  ) {}

  /** 모든 인프라 컴포넌트의 헬스 상태를 병렬로 확인해 결과를 반환합니다. */
  async getDetails(): Promise<HealthDetails> {
    const [cache, database] = await Promise.all([
      this.cacheHealthService.isHealthy(),
      this.databaseHealthService.isHealthy(),
    ]);

    return { cache, database };
  }
}
