/**
 * 비동기 실행 흐름 전체에서 요청 컨텍스트(traceId)를 공유하는 유틸리티.
 *
 * Node.js의 `AsyncLocalStorage`를 사용하면 콜백·Promise·async-await 체인을 거쳐도
 * 같은 요청에서 시작된 코드라면 동일한 컨텍스트 데이터에 접근할 수 있습니다.
 * `TraceIdMiddleware`가 요청 시작 시 `runWithRequestContext`를 호출해 컨텍스트를 설정하고,
 * 이후 어디서든 `getTraceId()`로 해당 요청의 traceId를 꺼낼 수 있습니다.
 */
import { AsyncLocalStorage } from 'node:async_hooks';

import type { Request } from 'express';

/** 요청당 저장되는 컨텍스트 데이터의 타입 */
export interface RequestContext {
  traceId: string;
}

/** Express Request에 traceId 필드를 추가한 확장 타입 */
export interface RequestWithTraceId extends Request {
  traceId: string;
}

// 요청별 컨텍스트를 비동기 경계를 넘어 전달하는 AsyncLocalStorage 인스턴스
const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/** 주어진 컨텍스트를 활성화한 상태로 콜백을 실행합니다. 미들웨어에서 호출합니다. */
export function runWithRequestContext<T>(
  context: RequestContext,
  callback: () => T,
) {
  return requestContextStorage.run(context, callback);
}

/** 현재 비동기 실행 흐름에 연결된 요청 컨텍스트 전체를 반환합니다. */
export function getRequestContext() {
  return requestContextStorage.getStore();
}

/** 현재 요청의 traceId를 반환합니다. 요청 컨텍스트 외부에서 호출하면 undefined를 반환합니다. */
export function getTraceId() {
  return getRequestContext()?.traceId;
}
