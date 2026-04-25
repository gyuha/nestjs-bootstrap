import { Global, Module } from "@nestjs/common";
import { redisClientServiceProvider, redisProvider } from "./redis.provider";

@Global()
@Module({
  providers: [redisClientServiceProvider, redisProvider],
  exports: [redisProvider],
})
export class RedisModule {}
