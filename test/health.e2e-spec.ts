import 'reflect-metadata';
import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ErrorTrackingService } from '../src/shared/infrastructure/monitoring/error-tracking.service';
import { HttpExceptionFilter } from '../src/shared/presentation/filters/http-exception.filter';
import { TransformInterceptor } from '../src/shared/presentation/interceptors/transform.interceptor';

describe('HealthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({
      type: VersioningType.HEADER,
      header: 'X-API-Version',
      defaultVersion: '1',
    });
    app.useGlobalFilters(
      new HttpExceptionFilter(app.get(ErrorTrackingService)),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 with db and cache status', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          success: true,
          data: {
            status: 'ok',
            db: 'ok',
            cache: 'ok',
          },
        });
      });
  });

  it('GET /health includes X-Trace-Id in response headers', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect((res) => {
        expect(res.headers['x-trace-id']).toBeDefined();
        expect(res.headers['x-trace-id']).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
      });
  });

  it('GET /health echoes back a custom X-Trace-Id header', () => {
    const customTrace = 'my-custom-trace-id-001';
    return request(app.getHttpServer())
      .get('/health')
      .set('X-Trace-Id', customTrace)
      .expect((res) => {
        expect(res.headers['x-trace-id']).toBe(customTrace);
      });
  });
});
