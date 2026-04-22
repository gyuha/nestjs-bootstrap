import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { QueueService } from '../../shared/infrastructure/queue/queue.service';
import { REDIS_CLIENT } from '../../shared/infrastructure/redis/redis.provider';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: {
    findByEmail: jest.Mock;
    create: jest.Mock;
    setEmailVerified: jest.Mock;
    updatePassword: jest.Mock;
  };
  let mockJwtService: { sign: jest.Mock; verify: jest.Mock };
  let mockRedis: {
    get: jest.Mock;
    setex: jest.Mock;
    del: jest.Mock;
    keys: jest.Mock;
  };
  let mockQueueService: { addJob: jest.Mock };
  let mockEventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      setEmailVerified: jest.fn().mockResolvedValue(undefined),
      updatePassword: jest.fn().mockResolvedValue(undefined),
    };
    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn(),
    };
    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      setex: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      keys: jest.fn().mockResolvedValue([]),
    };
    mockQueueService = {
      addJob: jest.fn().mockResolvedValue(undefined),
    };
    mockEventEmitter = {
      emit: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('1800'),
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              if (key === 'API_BASE_URL') return 'http://localhost:3000';
              return undefined;
            }),
          },
        },
        { provide: REDIS_CLIENT, useValue: mockRedis },
        { provide: QueueService, useValue: mockQueueService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register()', () => {
    it('creates user and returns tokens', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({
        id: 'uuid',
        email: 'test@example.com',
      });

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(mockUsersService.create).toHaveBeenCalled();
    });

    it('throws ConflictException when email exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Email already in use');
    });
  });

  describe('login()', () => {
    it('returns tokens', async () => {
      const result = await service.login(
        { email: 'test@example.com', password: 'password123' },
        { userId: 'uuid', email: 'test@example.com' },
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(result.accessToken).toBe('mock-token');
    });

    it('emits auth.login event', async () => {
      await service.login(
        { email: 'test@example.com', password: 'password123' },
        { userId: 'uuid', email: 'test@example.com' },
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('auth.login', {
        userId: 'uuid',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });
    });
  });

  describe('logout()', () => {
    it('clears refresh tokens and emits auth.logout event', async () => {
      mockRedis.keys.mockResolvedValue(['refresh:uuid:token']);

      await service.logout('uuid');

      expect(mockRedis.del).toHaveBeenCalledWith('refresh:uuid:token');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('auth.logout', {
        userId: 'uuid',
      });
    });
  });

  describe('forgotPassword()', () => {
    it('silently returns for unknown email', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.forgotPassword('unknown@example.com'),
      ).resolves.toBeUndefined();
      expect(mockQueueService.addJob).not.toHaveBeenCalled();
    });

    it('sends reset email for known user', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'uuid',
        email: 'test@example.com',
      });

      await service.forgotPassword('test@example.com');

      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining('email:password-reset:'),
        3600,
        'uuid',
      );
    });
  });

  describe('resetPassword()', () => {
    it('throws UnauthorizedException for invalid token', async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(
        service.resetPassword('bad-token', 'newpass123'),
      ).rejects.toThrow('Invalid or expired token');
    });

    it('updates password and emits auth.password-changed event', async () => {
      mockRedis.get.mockResolvedValue('user-uuid');

      await service.resetPassword('valid-token', 'newpassword123');

      expect(mockUsersService.updatePassword).toHaveBeenCalledWith(
        'user-uuid',
        expect.any(String),
      );
      expect(mockRedis.del).toHaveBeenCalledWith(
        'email:password-reset:valid-token',
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'auth.password-changed',
        {
          userId: 'user-uuid',
        },
      );
    });
  });

  describe('verifyEmail()', () => {
    it('throws UnauthorizedException for invalid token', async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(service.verifyEmail('bad-token')).rejects.toThrow(
        'Invalid or expired token',
      );
    });

    it('sets email verified for valid token', async () => {
      mockRedis.get.mockResolvedValue('user-uuid');

      await service.verifyEmail('valid-token');

      expect(mockUsersService.setEmailVerified).toHaveBeenCalledWith(
        'user-uuid',
      );
      expect(mockRedis.del).toHaveBeenCalledWith('email:verify:valid-token');
    });
  });

  describe('refreshTokens()', () => {
    it('issues new tokens for valid refresh token', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'uuid',
        email: 'test@example.com',
      });
      mockRedis.get.mockResolvedValue('valid-refresh-token');

      const result = await service.refreshTokens('valid-refresh-token');

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });
  });
});
