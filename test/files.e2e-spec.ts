import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ErrorTrackingService } from '../src/shared/infrastructure/monitoring/error-tracking.service';
import { HttpExceptionFilter } from '../src/shared/presentation/filters/http-exception.filter';
import { TransformInterceptor } from '../src/shared/presentation/interceptors/transform.interceptor';

describe('FilesController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    process.env['STORAGE_PROVIDER'] = 'local';
    process.env['STORAGE_LOCAL_PATH'] = './test-uploads';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
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

    // Register a user and get an access token for authenticated requests
    const email = `files-${Date.now()}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123' });
    accessToken = res.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /files/upload', () => {
    it('rejects without auth (401)', () => {
      return request(app.getHttpServer())
        .post('/files/upload?category=avatar')
        .attach('file', Buffer.from('fake'), 'test.png')
        .expect(401);
    });

    it('rejects without file (400)', () => {
      return request(app.getHttpServer())
        .post('/files/upload?category=avatar')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('rejects invalid category (400)', () => {
      return request(app.getHttpServer())
        .post('/files/upload?category=invalid')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from('fake'), 'test.png')
        .expect(400);
    });
  });

  describe('GET /files', () => {
    it('returns empty list initially (200)', () => {
      return request(app.getHttpServer())
        .get('/files')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });
  });

  describe('DELETE /files/:id', () => {
    it('returns 404 for non-existent file', () => {
      return request(app.getHttpServer())
        .delete('/files/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
