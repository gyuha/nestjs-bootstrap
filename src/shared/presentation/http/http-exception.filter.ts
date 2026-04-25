import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";
import type { RequestWithTraceId } from "../../../bootstrap/logging/trace-id.middleware";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & RequestWithTraceId>();

    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    const message =
      typeof exceptionResponse === "object" &&
      exceptionResponse !== null &&
      "message" in exceptionResponse
        ? exceptionResponse.message
        : statusCode === HttpStatus.INTERNAL_SERVER_ERROR
          ? "Internal server error"
          : "Request failed";

    response.status(statusCode).json({
      traceId: request.traceId,
      statusCode,
      message,
      errorCode: HttpStatus[statusCode] ?? "HTTP_ERROR",
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    });
  }
}
