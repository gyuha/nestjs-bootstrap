import {
  type CallHandler,
  Controller,
  type ExecutionContext,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Injectable,
  type NestInterceptor,
  UseInterceptors,
} from "@nestjs/common";
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import type { Response } from "express";
import { map, type Observable } from "rxjs";
import { SkipResponseEnvelope } from "../../../shared/presentation/http/skip-response-envelope.decorator";
import { HealthService } from "./health.service";

type HealthResponse = Awaited<ReturnType<HealthService["check"]>>;

@Injectable()
class HealthStatusInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<HealthResponse> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((health: HealthResponse) => {
        if (health.status !== "ok") {
          response.status(HttpStatus.SERVICE_UNAVAILABLE);
        }

        return health;
      }),
    );
  }
}

@ApiTags("health")
@Controller({ path: "health", version: "1" })
@SkipResponseEnvelope()
@SkipThrottle()
@UseInterceptors(HealthStatusInterceptor)
export class HealthController {
  @Inject(HealthService)
  private readonly healthService!: HealthService;

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: "All dependencies are healthy" })
  @ApiServiceUnavailableResponse({ description: "One or more dependencies are down" })
  async getHealth() {
    return this.healthService.check();
  }
}
