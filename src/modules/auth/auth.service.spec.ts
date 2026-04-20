import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: { findByEmail: jest.Mock; create: jest.Mock };
  let mockJwtService: { sign: jest.Mock; verify: jest.Mock };

  beforeEach(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn(),
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
            getOrThrow: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register()', () => {
    it('creates user and returns tokens', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({ id: 'uuid', email: 'test@example.com' });

      const result = await service.register({ email: 'test@example.com', password: 'password123' });

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(mockUsersService.create).toHaveBeenCalled();
    });

    it('throws ConflictException when email exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'existing' });

      await expect(service.register({ email: 'test@example.com', password: 'password123' }))
        .rejects.toThrow('Email already in use');
    });
  });

  describe('refreshTokens()', () => {
    it('issues new tokens for valid refresh token', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'uuid', email: 'test@example.com' });

      const result = await service.refreshTokens('valid-refresh-token');

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });
  });
});