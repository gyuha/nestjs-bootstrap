import { Inject, Injectable } from "@nestjs/common";
import type Redis from "ioredis";
import type { Pool } from "pg";
import { POSTGRES_POOL } from "../../../shared/infrastructure/database/database.tokens";
import { REDIS } from "../../../shared/infrastructure/redis/redis.tokens";

type ServiceHealth = {
  status: "ok" | "down";
};

const HEALTH_CHECK_TIMEOUT_MS = 1_000;

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
    return this.withTimeout(async () => {
      await this.pool.query("select 1");
    });
  }

  private async checkRedis(): Promise<ServiceHealth> {
    return this.withTimeout(async () => {
      if (this.redis.status === "wait") {
        await this.redis.connect();
      }

      await this.redis.ping();
    });
  }

  private async withTimeout(check: () => Promise<void>): Promise<ServiceHealth> {
    let timeout: NodeJS.Timeout | undefined;

    try {
      await Promise.race([
        check(),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => {
            reject(new Error("Health check timed out"));
          }, HEALTH_CHECK_TIMEOUT_MS);
        }),
      ]);

      return { status: "ok" };
    } catch {
      return { status: "down" };
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }
}
