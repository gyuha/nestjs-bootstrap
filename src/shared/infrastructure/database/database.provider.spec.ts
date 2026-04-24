import type { FactoryProvider } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { DatabaseProvider } from './database.provider';

const drizzle = jest.fn((database) => ({ database }));
const bunDrizzle = jest.fn((database) => ({ database }));
const Database = jest.fn(function MockDatabase(
  this: { filename: string },
  filename: string,
) {
  this.filename = filename;
});
const BunDatabase = jest.fn(function MockBunDatabase(
  this: { filename: string },
  filename: string,
) {
  this.filename = filename;
});

jest.mock('drizzle-orm/better-sqlite3', () => ({ __esModule: true, drizzle }));
jest.mock('drizzle-orm/bun-sqlite', () => ({
  __esModule: true,
  drizzle: bunDrizzle,
}));
jest.mock('better-sqlite3', () => ({ __esModule: true, default: Database }));
jest.mock('bun:sqlite', () => ({ Database: BunDatabase }), { virtual: true });

describe('DatabaseProvider', () => {
  let originalBunVersionDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    Reflect.deleteProperty(globalThis, 'Bun');
    originalBunVersionDescriptor = Object.getOwnPropertyDescriptor(
      process.versions,
      'bun',
    );
  });

  afterEach(() => {
    if (originalBunVersionDescriptor) {
      Object.defineProperty(
        process.versions,
        'bun',
        originalBunVersionDescriptor,
      );
      return;
    }

    Reflect.deleteProperty(process.versions, 'bun');
  });

  it('opens file-prefixed SQLite URLs as filesystem paths', async () => {
    const config = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          DATABASE_URL: 'file:./dev.db',
          NODE_ENV: 'development',
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    await (DatabaseProvider as FactoryProvider<Promise<unknown>>).useFactory(
      config,
    );

    expect(Database).toHaveBeenCalledWith('./dev.db');
  });

  it('uses Bun SQLite when running under Bun', async () => {
    Reflect.set(globalThis, 'Bun', {});
    const config = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          DATABASE_URL: 'file:./dev.db',
          NODE_ENV: 'development',
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    await (DatabaseProvider as FactoryProvider<Promise<unknown>>).useFactory(
      config,
    );

    expect(BunDatabase).toHaveBeenCalledWith('./dev.db');
    expect(bunDrizzle).toHaveBeenCalled();
    expect(Database).not.toHaveBeenCalled();
  });

  it('uses Bun SQLite when Bun is only exposed through process versions', async () => {
    Object.defineProperty(process.versions, 'bun', {
      configurable: true,
      value: '1.3.10',
    });
    const config = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          DATABASE_URL: 'file:./dev.db',
          NODE_ENV: 'development',
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    await (DatabaseProvider as FactoryProvider<Promise<unknown>>).useFactory(
      config,
    );

    expect(BunDatabase).toHaveBeenCalledWith('./dev.db');
    expect(Database).not.toHaveBeenCalled();
  });
});
