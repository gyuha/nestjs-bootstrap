import { Inject, Logger, Module, type OnModuleInit } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { DatabaseProvider } from './database.provider';
import { DRIZZLE_CLIENT } from './database.token';

@Module({
  providers: [DatabaseProvider],
  exports: [DatabaseProvider],
})
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(
    private readonly config: ConfigService,
    // biome-ignore lint/suspicious/noExplicitAny: drizzle client union type not statically resolvable
    @Inject(DRIZZLE_CLIENT) private readonly db: any,
  ) {}

  async onModuleInit(): Promise<void> {
    const env = this.config.get<string>('NODE_ENV');
    if (env !== 'production') {
      try {
        const { migrate } = await import('drizzle-orm/better-sqlite3/migrator');
        await migrate(this.db, {
          migrationsFolder: './src/shared/infrastructure/database/migrations',
        });
        this.logger.log('SQLite migrations applied');
      } catch {
        this.logger.warn('No migrations to apply or migrations folder missing');
      }
    }
  }
}
