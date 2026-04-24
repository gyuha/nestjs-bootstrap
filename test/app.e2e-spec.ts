import { type INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import request = require('supertest');

import { AppModule } from '../src/app.module';
import { setupValidation } from '../src/bootstrap/validation/setup-validation';

describe('App health endpoint (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    setupValidation(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns application health without version prefix', async () => {
    await request(app.getHttpServer()).get('/api/health').expect(200).expect({ status: 'ok' });
  });
});
