import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { REDIS } from "./redis.tokens";

export const redisProvider = {
  provide: REDIS,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    return new Redis(config.getOrThrow<string>("redis.url"), {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  },
};
