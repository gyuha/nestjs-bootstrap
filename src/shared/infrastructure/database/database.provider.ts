import type { OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { DATABASE, POSTGRES_POOL } from "./database.tokens";
import { schema } from "./schema";

export class PostgresPoolService implements OnApplicationShutdown {
  readonly pool: Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool({
      connectionString: databaseUrl,
    });
  }

  async onApplicationShutdown() {
    await this.pool.end();
  }
}

export const postgresPoolServiceProvider = {
  provide: PostgresPoolService,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    return new PostgresPoolService(config.getOrThrow<string>("database.url"));
  },
};

export const postgresPoolProvider = {
  provide: POSTGRES_POOL,
  inject: [PostgresPoolService],
  useFactory: (postgresPoolService: PostgresPoolService) => {
    return postgresPoolService.pool;
  },
};

export const databaseProvider = {
  provide: DATABASE,
  inject: [POSTGRES_POOL],
  useFactory: (pool: Pool) => {
    return drizzle(pool, { schema });
  },
};
