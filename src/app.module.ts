import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { ConfigModule_ } from "./config/config.module";
import { DrizzleModule } from "./infrastructure/database/drizzle.module";
import { RedisModule } from "./infrastructure/redis/redis.module";
import { UsersModule } from "./modules/users/users.module";
import { HealthModule } from "./bootstrap/health/health.module";
import { AuthModule } from "./modules/auth/infrastructure/auth.module";
import { MonitoringModule } from "./modules/monitoring/monitoring.module";
import { AiGatewayModule } from "./modules/ai-gateway/ai-gateway.module";
import { RagModule } from "./modules/rag/rag.module";

@Module({
  imports: [
    ConfigModule_,
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    DrizzleModule,
    RedisModule,
    UsersModule,
    HealthModule,
    AuthModule,
    MonitoringModule,
    AiGatewayModule,
    RagModule,
  ],
})
export class AppModule {}
