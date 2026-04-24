import { Inject, Logger, Module, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseProvider } from './database.provider';
import { DRIZZLE_CLIENT } from './database.token';

/** Drizzle ORM 클라이언트를 제공하고 마이그레이션을 수행하는 데이터베이스 모듈 */
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

  /** 모듈 초기화 시 비운영 환경에서 SQLite 마이그레이션을 자동 적용한다. */
  async onModuleInit(): Promise<void> {
    const env = this.config.get<string>('NODE_ENV');
    if (env !== 'production') {
      try {
        const { migrate } = await import('drizzle-orm/better-sqlite3/migrator');
        migrate(this.db, {
          migrationsFolder: './src/shared/infrastructure/database/migrations',
        });
        this.logger.log('SQLite migrations applied');
      } catch (error) {
        this.logger.warn(
          'No migrations to apply or migrations folder missing:',
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }
}
