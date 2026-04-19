import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { bootstrapApplication } from '../src/bootstrap/bootstrap-application';
import { CacheHealthService } from '../src/shared/infrastructure/cache/cache-health.service';
import { DatabaseHealthService } from '../src/shared/infrastructure/database/database-health.service';

const validEnvironment = {
  NODE_ENV: 'test',
  PORT: '3000',
  APP_NAME: 'nestjs-bootstrap',
  APP_DESCRIPTION: 'test',
  APP_VERSION: '0.1.0',
  APP_CORS_ORIGIN: 'http://localhost:3000',
  DB_DRIVER: 'sqlite',
  DATABASE_URL: '',
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: '5432',
  POSTGRES_USER: 'postgres',
  POSTGRES_PASSWORD: 'postgres',
  POSTGRES_DB: 'app',
  SQLITE_PATH: './data/test.sqlite',
  DATABASE_MIGRATIONS_DIR: './drizzle',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
  REDIS_PASSWORD: '',
  REDIS_DB: '2',
  REDIS_KEY_PREFIX: 'nestjs-bootstrap:test:',
  HEALTH_CACHE_KEY: 'health:check',
} as const;

function applyValidEnvironment() {
  Object.assign(process.env, validEnvironment);
}

async function createTestApp() {
  applyValidEnvironment();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  await bootstrapApplication(app);
  await app.init();

  return app;
}

async function createTestAppWithDependencyHealth(options: {
  cache: boolean;
  database: boolean;
}) {
  applyValidEnvironment();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(CacheHealthService)
    .useValue({
      isHealthy: jest.fn().mockResolvedValue(options.cache),
    })
    .overrideProvider(DatabaseHealthService)
    .useValue({
      isHealthy: jest.fn().mockResolvedValue(options.database),
    })
    .compile();

  const app = moduleRef.createNestApplication();
  await bootstrapApplication(app);
  await app.init();

  return app;
}

describe('Phase 1 foundation (e2e)', () => {
  let app: INestApplication;
  const originalEnv = { ...process.env };

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterEach(() => {
    applyValidEnvironment();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }

    process.env = originalEnv;
  });

  it('returns a versioned foundation response with a trace id', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1');

    expect(response.status).toBe(200);
    expect(response.headers['x-trace-id']).toBeDefined();
    expect(response.body).toEqual({
      success: true,
      data: {
        name: 'nestjs-bootstrap',
        version: '0.1.0',
        environment: 'test',
      },
      meta: {
        traceId: expect.any(String),
      },
    });
  });

  it('preserves an inbound trace id through the response contract', async () => {
    const traceId = 'trace-from-client';
    const response = await request(app.getHttpServer())
      .get('/api/v1')
      .set('x-trace-id', traceId);

    expect(response.status).toBe(200);
    expect(response.headers['x-trace-id']).toBe(traceId);
    expect(response.body.meta).toEqual({ traceId });
  });

  it('includes the inbound trace id in the error response envelope', async () => {
    const traceId = 'trace-on-error';
    const response = await request(app.getHttpServer())
      .get('/api/v1/missing')
      .set('x-trace-id', traceId);

    expect(response.status).toBe(404);
    expect(response.headers['x-trace-id']).toBe(traceId);
    expect(response.body).toEqual({
      success: false,
      error: 'Cannot GET /api/v1/missing',
      meta: { traceId },
    });
  });

  it('fails fast when environment configuration is invalid', async () => {
    process.env.PORT = '0';

    await expect(
      Test.createTestingModule({
        imports: [AppModule],
      }).compile(),
    ).rejects.toThrow(/Invalid environment configuration/);
  });

  it('applies the global rate limit guard', async () => {
    const isolatedApp = await createTestApp();

    try {
      const server = isolatedApp.getHttpServer();

      for (let attempt = 0; attempt < 60; attempt += 1) {
        const response = await request(server).get('/api/v1');

        expect(response.status).toBe(200);
      }

      const throttledResponse = await request(server).get('/api/v1');

      expect(throttledResponse.status).toBe(429);
      expect(throttledResponse.body).toEqual({
        success: false,
        error: 'ThrottlerException: Too Many Requests',
        meta: {
          traceId: expect.any(String),
        },
      });
    } finally {
      await isolatedApp.close();
    }
  });

  it('returns detailed health information for infrastructure dependencies', async () => {
    const isolatedApp = await createTestAppWithDependencyHealth({
      cache: true,
      database: true,
    });

    try {
      const response = await request(isolatedApp.getHttpServer()).get(
        '/api/v1/health/details',
      );

      expect(response.status).toBe(200);
      expect(response.headers['x-trace-id']).toBeDefined();
      expect(response.body).toEqual({
        success: true,
        data: {
          cache: true,
          database: true,
        },
        meta: {
          traceId: expect.any(String),
        },
      });
    } finally {
      await isolatedApp.close();
    }
  });

  it('returns a non-200 readiness response when a dependency is unhealthy', async () => {
    const isolatedApp = await createTestAppWithDependencyHealth({
      cache: false,
      database: true,
    });

    try {
      const response = await request(isolatedApp.getHttpServer()).get(
        '/api/v1/health/details',
      );

      expect(response.status).toBe(503);
      expect(response.headers['x-trace-id']).toBeDefined();
      expect(response.body).toEqual({
        success: false,
        error: 'Readiness check failed',
        meta: {
          traceId: expect.any(String),
        },
      });
    } finally {
      await isolatedApp.close();
    }
  });

  it('returns a versioned health status response', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.headers['x-trace-id']).toBeDefined();
    expect(response.body).toEqual({
      success: true,
      data: {
        status: 'ok',
      },
      meta: {
        traceId: expect.any(String),
      },
    });
  });

  it('keeps the base liveness endpoint fast and successful when readiness fails', async () => {
    const isolatedApp = await createTestAppWithDependencyHealth({
      cache: false,
      database: true,
    });

    try {
      const response = await request(isolatedApp.getHttpServer()).get(
        '/api/v1/health',
      );

      expect(response.status).toBe(200);
      expect(response.headers['x-trace-id']).toBeDefined();
      expect(response.body).toEqual({
        success: true,
        data: {
          status: 'ok',
        },
        meta: {
          traceId: expect.any(String),
        },
      });
    } finally {
      await isolatedApp.close();
    }
  });
});
