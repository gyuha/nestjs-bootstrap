import { Test, type TestingModule } from '@nestjs/testing';
import { DRIZZLE_CLIENT } from '../../shared/infrastructure/database/database.token';
import { UsersService } from './users.service';

// Factory function to create fresh mock for each test
function createMockDb() {
  return {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

describe('UsersService', () => {
  let service: UsersService;
  // biome-ignore lint/suspicious/noExplicitAny: mock db type
  let mockDb: any;

  beforeEach(async () => {
    mockDb = createMockDb();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: createUserDto.email,
        passwordHash: '$argon2hash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.insert.mockImplementation(() => ({
        values: () => ({
          returning: () => [mockUser],
        }),
      }));

      const result = await service.create(createUserDto);

      expect(result.email).toBe(createUserDto.email);
      expect(result.isActive).toBe(true);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        passwordHash: '$argon2hash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select.mockImplementation(() => ({
        from: () => ({
          where: () => ({
            limit: () => [mockUser],
          }),
        }),
      }));

      const result = await service.findByEmail('test@example.com');

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null for non-existent email', async () => {
      mockDb.select.mockImplementation(() => ({
        from: () => ({
          where: () => ({
            limit: () => [],
          }),
        }),
      }));

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        passwordHash: '$argon2hash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select.mockImplementation(() => ({
        from: () => ({
          where: () => ({
            limit: () => [mockUser],
          }),
        }),
      }));

      const result = await service.findById(mockUser.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockUser.id);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test1@example.com',
          passwordHash: '$argon2hash',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174001',
          email: 'test2@example.com',
          passwordHash: '$argon2hash',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDb.select.mockImplementation(() => ({
        from: () => mockUsers,
      }));

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('test1@example.com');
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateDto = { email: 'new@example.com' };
      const updatedUser = {
        id: userId,
        email: updateDto.email,
        passwordHash: '$argon2hash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.update.mockImplementation(() => ({
        set: () => ({
          where: () => ({
            returning: () => [updatedUser],
          }),
        }),
      }));

      const result = await service.update(userId, updateDto);

      expect(result?.email).toBe(updateDto.email);
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockDb.delete.mockImplementation(() => ({
        where: () => ({
          returning: () => [{ id: userId }],
        }),
      }));

      await expect(service.delete(userId)).resolves.toBeUndefined();
    });
  });

  describe('getUserRoles', () => {
    it('should return role names for a user', async () => {
      const mockRoles = [{ name: 'admin' }, { name: 'user' }];

      mockDb.select.mockImplementation(() => ({
        from: () => ({
          innerJoin: () => ({
            where: () => mockRoles,
          }),
        }),
      }));

      const result = await service.getUserRoles('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toContain('admin');
      expect(result).toContain('user');
    });
  });

  describe('getUserPermissions', () => {
    it('should return permissions for a user', async () => {
      const mockPermissions = [{ permission: 'users:read' }, { permission: 'users:write' }];

      mockDb.select.mockImplementation(() => ({
        from: () => ({
          innerJoin: () => ({
            innerJoin: () => ({
              where: () => mockPermissions,
            }),
          }),
        }),
      }));

      const result = await service.getUserPermissions('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toContain('users:read');
      expect(result).toContain('users:write');
    });
  });

  describe('findAllRoles', () => {
    it('should return all roles', async () => {
      const mockRoles = [
        { id: '123', name: 'admin', description: 'Admin role' },
        { id: '456', name: 'user', description: 'User role' },
      ];

      mockDb.select.mockImplementation(() => ({
        from: () => mockRoles,
      }));

      const result = await service.findAllRoles();

      expect(result).toHaveLength(2);
    });
  });

  describe('findRoleById', () => {
    it('should return a role by id', async () => {
      const mockRole = { id: '123', name: 'admin', description: 'Admin role' };

      mockDb.select.mockImplementation(() => ({
        from: () => ({
          where: () => ({
            limit: () => [mockRole],
          }),
        }),
      }));

      const result = await service.findRoleById('123');

      expect(result?.name).toBe('admin');
    });
  });

  describe('createRole', () => {
    it('should create a new role', async () => {
      const mockRole = { id: '123', name: 'moderator', description: 'Moderator role' };

      mockDb.insert.mockImplementation(() => ({
        values: () => ({
          returning: () => [mockRole],
        }),
      }));

      const result = await service.createRole({ name: 'moderator', description: 'Moderator role' });

      expect(result.name).toBe('moderator');
    });
  });

  describe('updateRole', () => {
    it('should update a role', async () => {
      const mockRole = { id: '123', name: 'admin', description: 'Updated description' };

      mockDb.update.mockImplementation(() => ({
        set: () => ({
          where: () => ({
            returning: () => [mockRole],
          }),
        }),
      }));

      const result = await service.updateRole('123', { description: 'Updated description' });

      expect(result?.description).toBe('Updated description');
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      mockDb.delete.mockImplementation(() => ({
        where: () => ({
          returning: () => [{ id: '123' }],
        }),
      }));

      await expect(service.deleteRole('123')).resolves.toBeUndefined();
    });
  });

  describe('assignRole', () => {
    it('should assign a role to a user', async () => {
      mockDb.insert.mockImplementation(() => ({
        values: () => ({}),
      }));

      await expect(
        service.assignRole('123e4567-e89b-12d3-a456-426614174000', '123'),
      ).resolves.toBeUndefined();
    });
  });

  describe('removeRole', () => {
    it('should remove a role from a user', async () => {
      mockDb.delete.mockImplementation(() => ({
        where: () => ({}),
      }));

      await expect(
        service.removeRole('123e4567-e89b-12d3-a456-426614174000', '123'),
      ).resolves.toBeUndefined();
    });
  });

  describe('setRolePermissions', () => {
    it('should set permissions for a role', async () => {
      mockDb.delete.mockImplementation(() => ({
        where: () => ({}),
      }));
      mockDb.insert.mockImplementation(() => ({
        values: () => ({}),
      }));

      const permissions = ['users:read', 'users:write'];

      await expect(service.setRolePermissions('123', permissions)).resolves.toBeUndefined();
    });
  });
});
