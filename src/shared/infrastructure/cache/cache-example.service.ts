/**
 * Redis 키 생성 방법을 보여주는 예시 서비스.
 *
 * 이 서비스는 Redis 직접 연산 대신, `CacheService.buildKey()`를 활용해
 * keyPrefix가 포함된 완전한 Redis 키를 만드는 패턴을 보여줍니다.
 * 실제 비즈니스 로직에서 Redis를 사용할 때 이 패턴을 참고하세요.
 * 새로운 캐시 기능을 추가할 때는 이 파일을 복사·수정하거나 새 서비스를 만드세요.
 */
import { Injectable } from '@nestjs/common';

import { AppConfigService } from '../../../bootstrap/config/app-config.service';

import { CacheService } from './cache.service';

/** Redis 키 생성 패턴의 사용 예시를 보여주는 서비스 */
@Injectable()
export class CacheExampleService {
  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly cacheService: CacheService,
  ) {}

  /** 헬스체크용 Redis 키의 완전한 경로(keyPrefix 포함)를 반환합니다. */
  getHealthCacheKey() {
    return this.cacheService.buildKey(this.appConfigService.healthCacheKey);
  }
}
