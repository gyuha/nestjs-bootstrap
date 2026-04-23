/**
 * request-context의 AsyncLocalStorage 동작을 검증하는 단위 테스트.
 *
 * 두 가지 핵심 속성을 테스트합니다:
 * 1. async/await 경계를 넘어도 같은 컨텍스트의 traceId가 유지되는가
 * 2. 동시에 실행되는 여러 컨텍스트가 서로 간섭하지 않는가 (격리성)
 */
import { getTraceId, runWithRequestContext } from './request-context';

describe('request-context', () => {
  it('preserves the trace id across async boundaries', async () => {
    await runWithRequestContext({ traceId: 'trace-123' }, async () => {
      await Promise.resolve();

      expect(getTraceId()).toBe('trace-123');
    });
  });

  it('isolates overlapping async contexts', async () => {
    const results = await Promise.all([
      runWithRequestContext({ traceId: 'trace-a' }, async () => {
        // 15ms 대기해 두 컨텍스트가 시간적으로 겹치도록 만듭니다.
        await new Promise((resolve) => setTimeout(resolve, 15));

        return getTraceId();
      }),
      runWithRequestContext({ traceId: 'trace-b' }, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));

        return getTraceId();
      }),
    ]);

    expect(results).toEqual(['trace-a', 'trace-b']);
    // 컨텍스트 바깥에서는 undefined를 반환해야 합니다.
    expect(getTraceId()).toBeUndefined();
  });
});
