/**
 * Redis 연결 상태를 확인하는 헬스체크 서비스.
 *
 * `CacheService.ping()`으로 PING 명령을 보내고 'PONG' 응답 여부로 정상 여부를 판단합니다.
 * 예외 발생 시(연결 실패, 타임아웃 등) false를 반환해 헬스체크가 실패 처리되도록 합니다.
 */
import { Injectable } from '@nestjs/common';

import { CACHE_HEALTH_RESPONSE } from './cache.constants';
import { CacheService } from './cache.service';

/** Redis ping 응답으로 캐시 연결 상태를 확인하는 서비스 */
@Injectable()
export class CacheHealthService {
  constructor(private readonly cacheService: CacheService) {}

  /** Redis가 'PONG'을 응답하면 true, 실패하거나 예외 발생 시 false를 반환합니다. */
  async isHealthy() {
    try {
      return (await this.cacheService.ping()) === CACHE_HEALTH_RESPONSE;
    } catch {
      return false;
    }
  }
}
