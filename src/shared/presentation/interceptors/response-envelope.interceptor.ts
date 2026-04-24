import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import { isPaginatedResult } from '../../application/pagination/pagination';
import type { ApiSuccessResponse } from '../responses/api-response';
import type { HttpRequestWithTrace } from '../types/http-request-with-trace';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<HttpRequestWithTrace>();

    return next.handle().pipe(
      map((value: unknown) => {
        const traceId = request.traceId ?? 'unknown';

        if (isPaginatedResult(value)) {
          return {
            data: value.items,
            meta: {
              traceId,
              pagination: value.pagination,
            },
          } satisfies ApiSuccessResponse<unknown[]>;
        }

        return {
          data: value ?? null,
          meta: {
            traceId,
          },
        } satisfies ApiSuccessResponse<unknown>;
      }),
    );
  }
}
