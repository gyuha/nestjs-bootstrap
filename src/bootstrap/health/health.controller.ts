import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Public } from "../../modules/auth/presentation/decorators/public.decorator";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: "Health check endpoint" })
  check(): { status: string; timestamp: string } {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
