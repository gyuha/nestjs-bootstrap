import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { EnvConfig } from "./env.schema";

@Injectable()
export class EnvService {
  constructor(private readonly config: ConfigService<EnvConfig>) {}

  get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.config.get(key)!;
  }

  get isDev(): boolean {
    return this.get("NODE_ENV") === "development";
  }

  get isProd(): boolean {
    return this.get("NODE_ENV") === "production";
  }
}
