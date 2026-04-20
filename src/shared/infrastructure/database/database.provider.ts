import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE_CLIENT } from './database.token';

export const DatabaseProvider: Provider = {
  provide: DRIZZLE_CLIENT,
  useFactory: async (config: ConfigService) => {
    const url = config.getOrThrow<string>('DATABASE_URL');

    if (config.get<string>('NODE_ENV') === 'production') {
      const { drizzle } = await import('drizzle-orm/postgres-js');
      const { default: postgres } = await import('postgres');
      return drizzle(postgres(url));
    }

    const { drizzle } = await import('drizzle-orm/better-sqlite3');
    const { default: Database } = await import('better-sqlite3');
    return drizzle(new Database(url));
  },
  inject: [ConfigService],
};
