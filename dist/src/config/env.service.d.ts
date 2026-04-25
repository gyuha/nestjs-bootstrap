import type { ConfigService } from "@nestjs/config";
import type { EnvConfig } from "./env.schema";
export declare class EnvService {
  private readonly config;
  constructor(config: ConfigService<EnvConfig>);
  get<K extends keyof EnvConfig>(key: K): EnvConfig[K];
  get isDev(): boolean;
  get isProd(): boolean;
}
