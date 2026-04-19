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
        await new Promise((resolve) => setTimeout(resolve, 15));

        return getTraceId();
      }),
      runWithRequestContext({ traceId: 'trace-b' }, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));

        return getTraceId();
      }),
    ]);

    expect(results).toEqual(['trace-a', 'trace-b']);
    expect(getTraceId()).toBeUndefined();
  });
});
