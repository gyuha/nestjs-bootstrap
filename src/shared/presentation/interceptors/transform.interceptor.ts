// src/shared/presentation/interceptors/transform.interceptor.ts
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SKIP_TRANSFORM_KEY } from '../decorators/skip-transform.decorator';
import type { ApiResponse } from '../dto/api-response.dto';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T> | T>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | T> {
    const skipHandler = Reflect.getMetadata(
      SKIP_TRANSFORM_KEY,
      context.getHandler(),
    ) as boolean | undefined;
    const skipClass = Reflect.getMetadata(
      SKIP_TRANSFORM_KEY,
      context.getClass(),
    ) as boolean | undefined;

    if (skipHandler || skipClass) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        if (data !== null && typeof data === 'object') {
          const obj = data as Record<string, unknown>;
          if (
            typeof obj.success === 'boolean' &&
            typeof obj.timestamp === 'string' &&
            ('data' in obj || 'meta' in obj)
          ) {
            return data as unknown as ApiResponse<T>;
          }
        }
        return {
          success: true as const,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
