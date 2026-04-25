import { Inject, Injectable } from "@nestjs/common";
import type Redis from "ioredis";
import type { Pool } from "pg";
import { POSTGRES_POOL } from "../../../shared/infrastructure/database/database.tokens";
import { REDIS } from "../../../shared/infrastructure/redis/redis.tokens";

type ServiceHealth = {
  status: "ok" | "down";
};

@Injectable()
export class HealthService {
  @Inject(POSTGRES_POOL)
  private readonly pool!: Pool;

  @Inject(REDIS)
  private readonly redis!: Redis;

  async check() {
    const services = {
      app: { status: "ok" as const },
      postgres: await this.checkPostgres(),
      redis: await this.checkRedis(),
    };

    const status = Object.values(services).every((service) => service.status === "ok")
      ? "ok"
      : "degraded";

    return {
      status,
      services,
    };
  }

  private async checkPostgres(): Promise<ServiceHealth> {
    try {
      await this.pool.query("select 1");
      return { status: "ok" };
    } catch {
      return { status: "down" };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    try {
      if (this.redis.status === "wait") {
        await this.redis.connect();
      }

      await this.redis.ping();
      return { status: "ok" };
    } catch {
      return { status: "down" };
    }
  }
}
