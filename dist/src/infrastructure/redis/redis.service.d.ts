import { type OnModuleDestroy } from "@nestjs/common";
import type { EnvService } from "../../config/env.service";
export declare class RedisService implements OnModuleDestroy {
  private readonly client;
  constructor(env: EnvService);
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  onModuleDestroy(): Promise<void>;
}
