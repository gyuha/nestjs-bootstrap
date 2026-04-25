import { Injectable, Logger, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Response } from "express";
import type { RequestWithTraceId } from "./trace-id.middleware";

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);

  use(req: RequestWithTraceId, res: Response, next: NextFunction) {
    const startedAt = Date.now();

    res.on("finish", () => {
      this.logger.log({
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
        traceId: req.traceId,
      });
    });

    next();
  }
}
