import { Module } from "@nestjs/common";
import { HealthController } from "./presentation/health.controller";
import { HealthService } from "./presentation/health.service";

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
