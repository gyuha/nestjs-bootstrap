import { Injectable, type NestInterceptor, type ExecutionContext, type CallHandler } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => ({
        data,
        meta: { traceId: (context.switchToHttp().getRequest() as any).traceId },
      })),
    );
  }
}
