/**
 * Redis 캐시 관련 상수 모음.
 *
 * `CACHE_HEALTH_RESPONSE`: Redis의 PING 명령에 대한 정상 응답값입니다.
 * `CACHE_LAZY_CLIENT_OPTIONS`: 앱 시작 시 Redis에 즉시 연결하지 않고,
 * 첫 명령 실행 시 연결하는 지연 연결(lazy connect) 옵션입니다.
 * `enableOfflineQueue: false`는 Redis 연결이 끊어진 동안 명령을 큐에 쌓지 않고
 * 즉시 오류를 반환해 헬스체크가 빠르게 실패하도록 합니다.
 */

/** Redis PING 명령의 정상 응답 문자열 */
export const CACHE_HEALTH_RESPONSE = 'PONG';

/** ioredis 지연 연결 옵션 — 앱 시작 시 불필요한 연결 시도를 방지합니다 */
export const CACHE_LAZY_CLIENT_OPTIONS = {
  enableOfflineQueue: false,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
} as const;
