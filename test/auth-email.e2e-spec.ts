import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth Email Flows (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env['EMAIL_PROVIDER'] = 'log';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/forgot-password', () => {
    it('returns 200 for unknown email (no user existence leak)', async () => {
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);
    });

    it('returns 200 for existing email', async () => {
      const email = `forgot-${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: 'password123' });

      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email })
        .expect(200);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('returns 401 for invalid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'invalid-token', newPassword: 'newpassword123' })
        .expect(401);
    });
  });

  describe('GET /auth/verify-email', () => {
    it('returns 401 for invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/verify-email?token=invalid-token')
        .expect(401);
    });
  });

  describe('POST /auth/subscribe', () => {
    it('returns 200 for valid email', async () => {
      const email = `sub-${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: 'password123' });

      await request(app.getHttpServer())
        .post('/auth/subscribe')
        .send({ email })
        .expect(200);
    });
  });

  describe('GET /auth/subscribe/confirm', () => {
    it('returns 401 for invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/subscribe/confirm?token=invalid-token')
        .expect(401);
    });
  });

  describe('GET /auth/unsubscribe', () => {
    it('returns 401 for invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/unsubscribe?token=invalid-token')
        .expect(401);
    });
  });
});
