import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { EnvService } from '../../config/env.service';

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  private readonly sql: postgres.Sql;
  readonly db: ReturnType<typeof drizzle>;

  constructor(env: EnvService) {
    const connectionString = env.get('DATABASE_URL');
    this.sql = postgres(connectionString);
    this.db = drizzle({ client: this.sql });
  }

  async onModuleDestroy() {
    await this.sql.end();
  }
}