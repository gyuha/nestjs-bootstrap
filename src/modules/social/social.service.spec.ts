import { Test, type TestingModule } from '@nestjs/testing';
import { SocialService } from './social.service';
import { UsersService } from '../users/users.service';
import { DRIZZLE_CLIENT } from '../../shared/infrastructure/database/database.token';

// Factory function to create fresh mock for each test
// biome-ignore lint/suspicious/noExplicitAny: drizzle client mock
function createMockDb() {
  return {
    select: jest.fn(),
    insert: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
    limit: jest.fn(),
  };
}

describe('SocialService', () => {
  let service: SocialService;
  // biome-ignore lint/suspicious/noExplicitAny: drizzle client mock
  let mockDb: any;
  // biome-ignore lint/suspicious/noExplicitAny: users service mock
  let mockUsersService: any;

  beforeEach(async () => {
    mockDb = createMockDb();
    mockUsersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialService,
        { provide: DRIZZLE_CLIENT, useValue: mockDb },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<SocialService>(SocialService);
  });

  describe('findOrCreateUser()', () => {
    it('returns existing user when social account exists', async () => {
      const existingUser = { id: 'user-1', email: 'test@example.com' };

      mockDb.select.mockImplementation(() => ({
        from: () => ({
          where: () => ({
            limit: () => [{ userId: 'user-1' }],
          }),
        }),
      }));
      mockUsersService.findById.mockResolvedValue(existingUser);

      const result = await service.findOrCreateUser({
        provider: 'google',
        providerId: '123',
        email: 'test@example.com',
      });

      expect(result).toEqual(existingUser);
      expect(mockUsersService.findById).toHaveBeenCalledWith('user-1');
    });

    it('links social account to existing user by email', async () => {
      const existingUser = { id: 'user-1', email: 'test@example.com' };

      // No existing social account
      mockDb.select.mockImplementation(() => ({
        from: () => ({
          where: () => ({
            limit: () => [],
          }),
        }),
      }));
      mockUsersService.findByEmail.mockResolvedValue(existingUser);
      mockDb.insert.mockImplementation(() => ({
        values: () => ({}),
      }));

      const result = await service.findOrCreateUser({
        provider: 'google',
        providerId: '456',
        email: 'test@example.com',
      });

      expect(result).toEqual(existingUser);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('creates new user when no existing user or social account', async () => {
      const newUser = { id: 'user-2', email: 'new@example.com' };

      // No existing social account
      mockDb.select.mockImplementation(() => ({
        from: () => ({
          where: () => ({
            limit: () => [],
          }),
        }),
      }));
      // No existing user by email
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(newUser);
      mockDb.insert.mockImplementation(() => ({
        values: () => ({}),
      }));

      const result = await service.findOrCreateUser({
        provider: 'github',
        providerId: '789',
        email: 'new@example.com',
      });

      expect(result).toEqual(newUser);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: 'new@example.com',
      });
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });
});
