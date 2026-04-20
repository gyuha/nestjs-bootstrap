import { ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('wraps object data in success format', (done) => {
    const next = { handle: () => of({ id: 1, name: 'test' }) };

    interceptor.intercept({} as ExecutionContext, next).subscribe((result: unknown) => {
      expect(result).toEqual({ success: true, data: { id: 1, name: 'test' } });
      done();
    });
  });

  it('wraps null data in success format', (done) => {
    const next = { handle: () => of(null) };

    interceptor.intercept({} as ExecutionContext, next).subscribe((result: unknown) => {
      expect(result).toEqual({ success: true, data: null });
      done();
    });
  });

  it('wraps array data in success format', (done) => {
    const next = { handle: () => of([1, 2, 3]) };

    interceptor.intercept({} as ExecutionContext, next).subscribe((result: unknown) => {
      expect(result).toEqual({ success: true, data: [1, 2, 3] });
      done();
    });
  });
});
