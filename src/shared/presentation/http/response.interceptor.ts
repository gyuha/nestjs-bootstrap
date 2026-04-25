import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { type Observable, map } from "rxjs";
import type { RequestWithTraceId } from "../../../bootstrap/logging/trace-id.middleware";
import { SKIP_RESPONSE_ENVELOPE } from "./skip-response-envelope.decorator";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_RESPONSE_ENVELOPE, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithTraceId>();

    return next.handle().pipe(
      map((data) => ({
        data,
        meta: {
          traceId: request.traceId,
        },
      })),
    );
  }
}
