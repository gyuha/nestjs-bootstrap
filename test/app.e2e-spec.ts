import { type INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import request = require('supertest');

import { AppModule } from '../src/app.module';
import { setupHttpPipeline } from '../src/bootstrap/http/setup-http-pipeline';
import { setupSecurity } from '../src/bootstrap/security/setup-security';
import { setupValidation } from '../src/bootstrap/validation/setup-validation';

describe('App health endpoint (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupSecurity(app);
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    setupValidation(app);
    setupHttpPipeline(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns application health in the standard response envelope', async () => {
    const response = await request(app.getHttpServer()).get('/api/health').expect(200);

    expect(response.body).toEqual({
      data: {
        status: 'ok',
      },
      meta: {
        traceId: expect.any(String),
      },
    });
    expect(response.headers['x-trace-id']).toBe(response.body.meta.traceId);
  });

  it('reuses provided trace id in response header and body metadata', async () => {
    const traceId = 'test-trace-id';

    const response = await request(app.getHttpServer())
      .get('/api/health')
      .set('x-trace-id', traceId)
      .expect(200);

    expect(response.headers['x-trace-id']).toBe(traceId);
    expect(response.body.meta.traceId).toBe(traceId);
  });
});
