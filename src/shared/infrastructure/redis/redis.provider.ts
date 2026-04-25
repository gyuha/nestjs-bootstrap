import type { OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { REDIS } from "./redis.tokens";

const CONNECTED_STATUSES = new Set(["connect", "ready"]);

export class RedisClientService implements OnApplicationShutdown {
  readonly client: Redis;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  async onApplicationShutdown() {
    try {
      if (CONNECTED_STATUSES.has(this.client.status)) {
        await this.client.quit();
        return;
      }
    } catch {
      this.client.disconnect();
      return;
    }

    if (this.client.status !== "end") {
      this.client.disconnect();
    }
  }
}

export const redisClientServiceProvider = {
  provide: RedisClientService,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    return new RedisClientService(config.getOrThrow<string>("redis.url"));
  },
};

export const redisProvider = {
  provide: REDIS,
  inject: [RedisClientService],
  useFactory: (redisClientService: RedisClientService) => {
    return redisClientService.client;
  },
};
