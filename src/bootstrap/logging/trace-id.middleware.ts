import { randomUUID } from "node:crypto";
import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

export const TRACE_ID_HEADER = "x-request-id";

export type RequestWithTraceId = Request & {
  traceId?: string;
};

@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: RequestWithTraceId, res: Response, next: NextFunction) {
    const incomingTraceId = req.header(TRACE_ID_HEADER);
    const traceId = incomingTraceId && incomingTraceId.length > 0 ? incomingTraceId : randomUUID();

    req.traceId = traceId;
    res.setHeader(TRACE_ID_HEADER, traceId);

    next();
  }
}
