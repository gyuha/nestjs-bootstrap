import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { DATABASE, POSTGRES_POOL } from "./database.tokens";
import { schema } from "./schema";

export const postgresPoolProvider = {
  provide: POSTGRES_POOL,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    return new Pool({
      connectionString: config.getOrThrow<string>("database.url"),
    });
  },
};

export const databaseProvider = {
  provide: DATABASE,
  inject: [POSTGRES_POOL],
  useFactory: (pool: Pool) => {
    return drizzle(pool, { schema });
  },
};
