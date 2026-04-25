import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from "@nestjs/common";
import type { Observable } from "rxjs";
import { v4 as uuidv4 } from "uuid";

export const TRACE_ID_HEADER = "x-trace-id";

@Injectable()
export class TraceIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const traceId = (request.headers[TRACE_ID_HEADER] as string) || uuidv4();

    request.traceId = traceId;
    response.setHeader(TRACE_ID_HEADER, traceId);

    return next.handle();
  }
}
