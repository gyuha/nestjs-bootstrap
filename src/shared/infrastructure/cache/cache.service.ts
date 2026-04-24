import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

/** Redis를 백엔드로 사용하는 범용 캐시 서비스 */
@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /** 키에 해당하는 캐시 값을 반환한다. 없으면 null.
   * @param key 캐시 키
   * @returns 캐시된 값 또는 null
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.cacheManager.get<T>(key);
    return value ?? null;
  }

  /** 키-값 쌍을 캐시에 저장한다.
   * @param key 캐시 키
   * @param value 저장할 값
   * @param ttl 만료 시간(초). 생략 시 기본값 적용
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  /** 키에 해당하는 캐시 항목을 삭제한다.
   * @param key 삭제할 캐시 키
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }
}
