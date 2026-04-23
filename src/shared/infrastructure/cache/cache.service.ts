/**
 * Redis 연결을 관리하는 서비스.
 *
 * ioredis 클라이언트를 초기화하고, 앱 종료 시 연결을 안전하게 닫습니다.
 * `lazyConnect: true` 옵션으로 첫 명령 실행 시에만 실제 연결을 맺습니다.
 * 다른 서비스에서 Redis를 사용하려면 이 서비스를 주입받아 `this.cacheService.client`로 접근하세요.
 * `onApplicationShutdown`은 NestJS 생명주기 훅으로, 앱 종료 신호를 받으면 자동 호출됩니다.
 */
import { Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { Redis } from 'ioredis';

import { AppConfigService } from '../../../bootstrap/config/app-config.service';

import { CACHE_LAZY_CLIENT_OPTIONS } from './cache.constants';

/** Redis 클라이언트 초기화·ping·종료를 담당하는 서비스 */
@Injectable()
export class CacheService implements OnApplicationShutdown {
  readonly client;

  constructor(private readonly appConfigService: AppConfigService) {
    this.client = new Redis({
      host: appConfigService.redisHost,
      port: appConfigService.redisPort,
      password: appConfigService.redisPassword || undefined,
      db: appConfigService.redisDb,
      keyPrefix: appConfigService.redisKeyPrefix,
      ...CACHE_LAZY_CLIENT_OPTIONS,
    });
  }

  /** keyPrefix가 포함된 완전한 Redis 키 문자열을 반환합니다. */
  buildKey(key: string) {
    const keyPrefix = this.client.options.keyPrefix;

    return `${typeof keyPrefix === 'string' ? keyPrefix : ''}${key}`;
  }

  /** Redis에 PING 명령을 보내 연결 상태를 확인합니다. */
  async ping() {
    return this.client.ping();
  }

  /** 앱 종료 시 Redis 연결 상태(`end`·`wait`·기타)에 따라 no-op·disconnect·quit 중 하나를 실행합니다. */
  async onApplicationShutdown() {
    if (this.client.status === 'end') {
      return;
    }

    // 아직 연결이 시작되지 않은 상태면 즉시 연결을 끊습니다.
    if (this.client.status === 'wait') {
      this.client.disconnect();

      return;
    }

    try {
      // 진행 중인 명령이 완료된 후 연결을 종료합니다.
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }
}
