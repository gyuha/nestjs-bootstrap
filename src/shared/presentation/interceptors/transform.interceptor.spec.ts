// src/shared/presentation/interceptors/transform.interceptor.spec.ts
import type { ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { SKIP_TRANSFORM_KEY } from '../decorators/skip-transform.decorator';
import { TransformInterceptor } from './transform.interceptor';

const makeContext = (
  skipHandler = false,
  skipClass = false,
): ExecutionContext =>
  ({
    getHandler: () => {
      const fn = () => {};
      if (skipHandler) Reflect.defineMetadata(SKIP_TRANSFORM_KEY, true, fn);
      return fn;
    },
    getClass: () => {
      const cls = class {};
      if (skipClass) Reflect.defineMetadata(SKIP_TRANSFORM_KEY, true, cls);
      return cls;
    },
  }) as unknown as ExecutionContext;

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('wraps plain data in success envelope with timestamp', (done) => {
    const next = { handle: () => of({ id: 1 }) };
    interceptor.intercept(makeContext(), next).subscribe((result: unknown) => {
      const r = result as Record<string, unknown>;
      expect(r.success).toBe(true);
      expect(r.data).toEqual({ id: 1 });
      expect(typeof r.timestamp).toBe('string');
      done();
    });
  });

  it('wraps null in success envelope', (done) => {
    const next = { handle: () => of(null) };
    interceptor.intercept(makeContext(), next).subscribe((result: unknown) => {
      const r = result as Record<string, unknown>;
      expect(r.success).toBe(true);
      expect(r.data).toBeNull();
      done();
    });
  });

  it('skips wrapping when handler has @SkipTransform()', (done) => {
    const raw = { id: 1 };
    const next = { handle: () => of(raw) };
    interceptor
      .intercept(makeContext(true, false), next)
      .subscribe((result: unknown) => {
        expect(result).toBe(raw);
        done();
      });
  });

  it('skips wrapping when class has @SkipTransform()', (done) => {
    const raw = { id: 1 };
    const next = { handle: () => of(raw) };
    interceptor
      .intercept(makeContext(false, true), next)
      .subscribe((result: unknown) => {
        expect(result).toBe(raw);
        done();
      });
  });

  it('does not double-wrap already-enveloped response', (done) => {
    const alreadyWrapped = { success: true, data: { id: 2 }, timestamp: 'x' };
    const next = { handle: () => of(alreadyWrapped) };
    interceptor.intercept(makeContext(), next).subscribe((result: unknown) => {
      expect(result).toBe(alreadyWrapped);
      done();
    });
  });
});
