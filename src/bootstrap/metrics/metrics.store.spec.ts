import { MetricsStore } from './metrics.store';

describe('MetricsStore', () => {
  let store: MetricsStore;

  beforeEach(() => {
    store = new MetricsStore();
  });

  afterEach(() => {
    store[Symbol.dispose]();
  });

  it('starts with zero counts', () => {
    const snap = store.snapshot();
    expect(snap.requests.total).toBe(0);
    expect(snap.errors.client4xx).toBe(0);
    expect(snap.errors.server5xx).toBe(0);
  });

  it('records a single request', () => {
    store.record('GET', 200, 10);
    const snap = store.snapshot();
    expect(snap.requests.total).toBe(1);
    expect(snap.requests.byStatus[200]).toBe(1);
    expect(snap.requests.byMethod.GET).toBe(1);
  });

  it('accumulates multiple requests', () => {
    store.record('GET', 200, 10);
    store.record('GET', 200, 20);
    store.record('POST', 201, 30);
    const snap = store.snapshot();
    expect(snap.requests.total).toBe(3);
    expect(snap.requests.byStatus[200]).toBe(2);
    expect(snap.requests.byStatus[201]).toBe(1);
    expect(snap.requests.byMethod.POST).toBe(1);
  });

  it('counts 4xx as client errors', () => {
    store.record('GET', 404, 5);
    store.record('POST', 400, 3);
    expect(store.snapshot().errors.client4xx).toBe(2);
  });

  it('counts 5xx as server errors', () => {
    store.record('GET', 500, 5);
    store.record('GET', 503, 3);
    expect(store.snapshot().errors.server5xx).toBe(2);
  });

  it('does not count 3xx as errors', () => {
    store.record('GET', 301, 5);
    const snap = store.snapshot();
    expect(snap.errors.client4xx).toBe(0);
    expect(snap.errors.server5xx).toBe(0);
  });

  it('computes p50/p95/p99 from latency window', () => {
    for (let i = 1; i <= 100; i++) {
      store.record('GET', 200, i);
    }
    const snap = store.snapshot();
    expect(snap.latency.p50).toBe(51);
    expect(snap.latency.p95).toBe(96);
    expect(snap.latency.p99).toBe(100);
  });

  it('uses a sliding window of last 1000 entries', () => {
    for (let i = 1; i <= 1500; i++) {
      store.record('GET', 200, i);
    }
    const snap = store.snapshot();
    expect(snap.requests.total).toBe(1500);
    expect(snap.latency.p99).toBeGreaterThanOrEqual(1490);
  });

  it('resets all counters', () => {
    store.record('GET', 200, 10);
    store.record('GET', 500, 5);
    store.reset();
    const snap = store.snapshot();
    expect(snap.requests.total).toBe(0);
    expect(snap.errors.server5xx).toBe(0);
  });

  it('returns zero percentiles when empty', () => {
    const snap = store.snapshot();
    expect(snap.latency.p50).toBe(0);
    expect(snap.latency.p95).toBe(0);
    expect(snap.latency.p99).toBe(0);
  });

  it('includes uptime in snapshot', () => {
    const snap = store.snapshot();
    expect(typeof snap.uptime).toBe('number');
    expect(snap.uptime).toBeGreaterThanOrEqual(0);
  });
});
