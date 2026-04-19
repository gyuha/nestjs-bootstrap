import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { Test } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { AppConfigModule } from '../src/bootstrap/config/app-config.module';
import { AppConfigService } from '../src/bootstrap/config/app-config.service';
import { CacheExampleService } from '../src/shared/infrastructure/cache/cache-example.service';
import { CacheHealthService } from '../src/shared/infrastructure/cache/cache-health.service';
import { createDatabaseClient } from '../src/shared/infrastructure/database/create-database-client';
import { DatabaseHealthService } from '../src/shared/infrastructure/database/database-health.service';
import { DatabaseService } from '../src/shared/infrastructure/database/database.service';

const testSqlitePath = './data/test.sqlite';
const preservedSqlitePath = './data/preserve-me.sqlite';

const sqliteEnvironment = {
  NODE_ENV: 'test',
  PORT: '3000',
  APP_NAME: 'nestjs-bootstrap',
  APP_DESCRIPTION: 'test',
  APP_VERSION: '0.1.0',
  APP_CORS_ORIGIN: 'http://localhost:3000',
  DB_DRIVER: 'sqlite',
  DATABASE_URL: `file:${testSqlitePath}`,
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: '5432',
  POSTGRES_USER: 'postgres',
  POSTGRES_PASSWORD: 'postgres',
  POSTGRES_DB: 'app',
  SQLITE_PATH: testSqlitePath,
  DATABASE_MIGRATIONS_DIR: './drizzle',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
  REDIS_PASSWORD: '',
  REDIS_DB: '2',
  REDIS_KEY_PREFIX: 'nestjs-bootstrap:test:',
  HEALTH_CACHE_KEY: 'health:check',
} as const;

const postgresUrlOnlyEnvironment = {
  ...sqliteEnvironment,
  DB_DRIVER: 'postgres',
  DATABASE_URL: 'postgres://urluser:urlpass@urlhost:5433/urldb',
  POSTGRES_HOST: '',
  POSTGRES_PORT: '',
  POSTGRES_USER: '',
  POSTGRES_PASSWORD: '',
  POSTGRES_DB: '',
  SQLITE_PATH: '',
  DATABASE_MIGRATIONS_DIR: '',
} as const;

const sqliteDatabaseUrlOnlyEnvironment = {
  ...sqliteEnvironment,
  DATABASE_URL: 'file:./data/url-only.sqlite',
  SQLITE_PATH: '',
} as const;

const invalidSqliteDatabaseUrlEnvironment = {
  ...sqliteEnvironment,
  DATABASE_URL: 'not-a-file-url',
} as const;

function applySqliteEnvironment() {
  Object.assign(process.env, sqliteEnvironment);
}

function loadDrizzleConfig() {
  jest.resetModules();

  return require('../drizzle.config').default as {
    dbCredentials: { url: string };
    dialect: string;
    out: string;
    schema: string;
  };
}

function cleanupTestSqliteArtifacts() {
  rmSync(testSqlitePath, { force: true });
  rmSync(`${testSqlitePath}-shm`, { force: true });
  rmSync(`${testSqlitePath}-wal`, { force: true });
}

describe('Database config runtime parsing (e2e)', () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    applySqliteEnvironment();
  });

  beforeEach(() => {
    applySqliteEnvironment();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('parses sqlite runtime configuration through AppConfigService', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppConfigModule],
    }).compile();

    const appConfigService = moduleRef.get(AppConfigService);

    expect(appConfigService.databaseDriver).toBe('sqlite');
    expect(appConfigService.databaseUrl).toBe('file:./data/test.sqlite');
    expect(appConfigService.postgresHost).toBe('localhost');
    expect(appConfigService.postgresPort).toBe(5432);
    expect(appConfigService.postgresUser).toBe('postgres');
    expect(appConfigService.postgresPassword).toBe('postgres');
    expect(appConfigService.postgresDb).toBe('app');
    expect(appConfigService.sqlitePath).toBe('./data/test.sqlite');
    expect(appConfigService.databaseMigrationsDir).toBe('./drizzle');
    expect(appConfigService.redisHost).toBe('localhost');
    expect(appConfigService.redisPort).toBe(6379);
    expect(appConfigService.redisPassword).toBe('');
    expect(appConfigService.redisDb).toBe(2);
    expect(appConfigService.redisKeyPrefix).toBe('nestjs-bootstrap:test:');
    expect(appConfigService.healthCacheKey).toBe('health:check');

    await moduleRef.close();
  });

  it('parses sqlite runtime configuration when only a sqlite DATABASE_URL is provided', async () => {
    Object.assign(process.env, sqliteDatabaseUrlOnlyEnvironment);

    const moduleRef = await Test.createTestingModule({
      imports: [AppConfigModule],
    }).compile();

    const appConfigService = moduleRef.get(AppConfigService);

    expect(appConfigService.databaseDriver).toBe('sqlite');
    expect(appConfigService.databaseUrl).toBe('file:./data/url-only.sqlite');
    expect(appConfigService.sqlitePath).toBe('');

    await moduleRef.close();
  });

  it('rejects a non-file DATABASE_URL when DB_DRIVER=sqlite', async () => {
    Object.assign(process.env, invalidSqliteDatabaseUrlEnvironment);

    await expect(
      Test.createTestingModule({
        imports: [AppConfigModule],
      }).compile(),
    ).rejects.toThrow(/database_url must use the file: scheme/i);
  });

  it('creates a sqlite database client from AppConfigService runtime values', async () => {
    mkdirSync(dirname(preservedSqlitePath), { recursive: true });
    writeFileSync(preservedSqlitePath, 'keep me');

    const moduleRef = await Test.createTestingModule({
      imports: [AppConfigModule],
    }).compile();

    const appConfigService = moduleRef.get(AppConfigService);
    const databaseClient = createDatabaseClient({
      databaseUrl: appConfigService.databaseUrl,
      driver: appConfigService.databaseDriver,
      postgresDatabase: appConfigService.postgresDb,
      postgresHost: appConfigService.postgresHost,
      postgresPassword: appConfigService.postgresPassword,
      postgresPort: appConfigService.postgresPort,
      postgresUser: appConfigService.postgresUser,
      sqlitePath: appConfigService.sqlitePath,
    });

    if (databaseClient.driver !== 'sqlite') {
      throw new Error(
        `Expected sqlite database client, received ${databaseClient.driver}`,
      );
    }

    expect(databaseClient.driver).toBe('sqlite');
    expect(databaseClient.client.name).toBe(appConfigService.sqlitePath);
    expect(typeof databaseClient.client.prepare).toBe('function');
    expect(typeof databaseClient.db.select).toBe('function');

    databaseClient.client.close();
    cleanupTestSqliteArtifacts();

    expect(existsSync(testSqlitePath)).toBe(false);
    expect(existsSync(preservedSqlitePath)).toBe(true);

    rmSync(preservedSqlitePath, { force: true });
    await moduleRef.close();
  });

  it('loads drizzle config from the runtime sqlite contract when DATABASE_URL is blank', () => {
    process.env.DATABASE_URL = '';
    process.env.SQLITE_PATH = './data/from-sqlite-path.sqlite';
    process.env.DATABASE_MIGRATIONS_DIR = './drizzle/runtime-migrations';

    const drizzleConfig = loadDrizzleConfig();

    expect(drizzleConfig.dbCredentials.url).toBe(
      './data/from-sqlite-path.sqlite',
    );
    expect(drizzleConfig.dialect).toBe('sqlite');
    expect(drizzleConfig.out).toBe('./drizzle/runtime-migrations');
    expect(drizzleConfig.schema).toBe('./drizzle/schema/sqlite.ts');
  });

  it('loads drizzle config from the runtime postgres contract without treating the url as a sqlite path', () => {
    process.env.DB_DRIVER = 'postgres';
    process.env.DATABASE_URL =
      'postgres://postgres:postgres@localhost:5432/app';
    process.env.SQLITE_PATH = './data/should-not-be-used.sqlite';
    process.env.DATABASE_MIGRATIONS_DIR = './drizzle/postgres-migrations';

    const drizzleConfig = loadDrizzleConfig();

    expect(drizzleConfig.dbCredentials.url).toBe(
      'postgres://postgres:postgres@localhost:5432/app',
    );
    expect(drizzleConfig.dialect).toBe('postgresql');
    expect(drizzleConfig.out).toBe('./drizzle/postgres-migrations');
    expect(drizzleConfig.schema).toBe('./drizzle/schema/postgres.ts');
  });

  it('parses postgres runtime configuration when DATABASE_URL is provided without sqlite or postgres tuple fallbacks', async () => {
    Object.assign(process.env, postgresUrlOnlyEnvironment);

    const moduleRef = await Test.createTestingModule({
      imports: [AppConfigModule],
    }).compile();

    const appConfigService = moduleRef.get(AppConfigService);

    expect(appConfigService.databaseDriver).toBe('postgres');
    expect(appConfigService.databaseUrl).toBe(
      'postgres://urluser:urlpass@urlhost:5433/urldb',
    );
    expect(appConfigService.postgresHost).toBe('');
    expect(appConfigService.postgresPort).toBe('');
    expect(appConfigService.postgresUser).toBe('');
    expect(appConfigService.postgresPassword).toBe('');
    expect(appConfigService.postgresDb).toBe('');
    expect(appConfigService.sqlitePath).toBe('');
    expect(appConfigService.databaseMigrationsDir).toBe('');

    await moduleRef.close();
  });

  it('keeps postgres migration output driver-aware when DATABASE_MIGRATIONS_DIR is blank', () => {
    process.env.DB_DRIVER = 'postgres';
    process.env.DATABASE_URL =
      'postgres://postgres:postgres@localhost:5432/app';
    process.env.DATABASE_MIGRATIONS_DIR = '';

    const postgresConfig = loadDrizzleConfig();

    expect(postgresConfig.out).toBe('./drizzle/migrations/postgres');

    process.env.DB_DRIVER = 'sqlite';
    process.env.DATABASE_URL = '';
    process.env.SQLITE_PATH = './data/from-sqlite-path.sqlite';
    process.env.DATABASE_MIGRATIONS_DIR = '';

    const sqliteConfig = loadDrizzleConfig();

    expect(sqliteConfig.out).toBe('./drizzle/migrations/sqlite');
  });

  it('fails fast when sqlite driver receives an obvious postgres url', () => {
    expect(() =>
      createDatabaseClient({
        databaseUrl: 'postgres://postgres:postgres@localhost:5432/app',
        driver: 'sqlite',
        postgresDatabase: 'app',
        postgresHost: 'localhost',
        postgresPassword: 'postgres',
        postgresPort: 5432,
        postgresUser: 'postgres',
        sqlitePath: './data/test.sqlite',
      }),
    ).toThrow(/sqlite driver requires database_url values to use file:/i);
  });

  it('fails fast when sqlite driver receives any non-file DATABASE_URL', () => {
    expect(() =>
      createDatabaseClient({
        databaseUrl: 'not-a-file-url',
        driver: 'sqlite',
        postgresDatabase: 'app',
        postgresHost: 'localhost',
        postgresPassword: 'postgres',
        postgresPort: 5432,
        postgresUser: 'postgres',
        sqlitePath: './data/test.sqlite',
      }),
    ).toThrow(/sqlite driver requires database_url values to use file:/i);
  });

  it('creates a postgres database client with the postgres schema module and connection string', async () => {
    const databaseClient = createDatabaseClient({
      databaseUrl: 'postgres://postgres:postgres@localhost:5432/app',
      driver: 'postgres',
      postgresDatabase: 'app',
      postgresHost: 'localhost',
      postgresPassword: 'postgres',
      postgresPort: 5432,
      postgresUser: 'postgres',
      sqlitePath: './data/test.sqlite',
    });

    if (databaseClient.driver !== 'postgres') {
      throw new Error(
        `Expected postgres database client, received ${databaseClient.driver}`,
      );
    }

    expect(databaseClient.client.options.connectionString).toBe(
      'postgres://postgres:postgres@localhost:5432/app',
    );
    expect(
      databaseClient.db._.fullSchema.healthSnapshots.createdAt.columnType,
    ).toBe('PgInteger');
    expect(
      databaseClient.db._.fullSchema.healthSnapshots.details.columnType,
    ).toBe('PgJsonb');

    await databaseClient.client.end();
  });

  it('prefers DATABASE_URL over explicit postgres tuple fields when building the postgres client', async () => {
    const databaseClient = createDatabaseClient({
      databaseUrl: 'postgres://urluser:urlpass@urlhost:5433/urldb',
      driver: 'postgres',
      postgresDatabase: 'tuple-db',
      postgresHost: 'tuple-host',
      postgresPassword: 'tuple-pass',
      postgresPort: 5432,
      postgresUser: 'tuple-user',
      sqlitePath: './data/test.sqlite',
    });

    if (databaseClient.driver !== 'postgres') {
      throw new Error(
        `Expected postgres database client, received ${databaseClient.driver}`,
      );
    }

    expect(databaseClient.client.options.connectionString).toBe(
      'postgres://urluser:urlpass@urlhost:5433/urldb',
    );
    expect(databaseClient.client.options.host).toBeUndefined();
    expect(databaseClient.client.options.port).toBeUndefined();
    expect(databaseClient.client.options.user).toBeUndefined();
    expect(databaseClient.client.options.password).toBeUndefined();
    expect(databaseClient.client.options.database).toBeUndefined();

    await databaseClient.client.end();
  });

  it('registers DatabaseHealthService through DatabaseModule in AppModule', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const databaseHealthService = moduleRef.get(DatabaseHealthService);
    const databaseService = moduleRef.get(DatabaseService);
    const databaseClient = databaseService.databaseClient;

    expect(databaseHealthService).toBeInstanceOf(DatabaseHealthService);
    await expect(databaseHealthService.isHealthy()).resolves.toBe(true);

    if (databaseClient.driver !== 'sqlite') {
      throw new Error(
        `Expected sqlite database service, received ${databaseClient.driver}`,
      );
    }

    databaseClient.client.close();

    await expect(databaseHealthService.isHealthy()).resolves.toBe(false);

    await moduleRef.close();
  });

  it('registers Redis example services through CacheModule in AppModule', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const cacheExampleService = moduleRef.get(CacheExampleService);
    const cacheHealthService = moduleRef.get(CacheHealthService);

    expect(cacheExampleService).toBeInstanceOf(CacheExampleService);
    expect(cacheHealthService).toBeInstanceOf(CacheHealthService);
    expect(cacheExampleService.getHealthCacheKey()).toBe(
      'nestjs-bootstrap:test:health:check',
    );
    await expect(cacheHealthService.isHealthy()).resolves.toBe(false);

    await moduleRef.close();
  });
});
