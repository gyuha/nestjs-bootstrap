import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, type TestingModule } from '@nestjs/testing';
import { DRIZZLE_CLIENT } from '../../shared/infrastructure/database/database.token';
import { UsersService } from './users.service';

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
  let mockEventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    mockDb = createMockDb();
    mockEventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: DRIZZLE_CLIENT, useValue: mockDb },
        { provide: EventEmitter2, useValue: mockEventEmitter },
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
        values: () => ({ returning: () => [mockUser] }),
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
        from: () => ({ where: () => ({ limit: () => [mockUser] }) }),
      }));

      const result = await service.findByEmail('test@example.com');
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null for non-existent email', async () => {
      mockDb.select.mockImplementation(() => ({
        from: () => ({ where: () => ({ limit: () => [] }) }),
      }));

      expect(await service.findByEmail('nonexistent@example.com')).toBeNull();
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
        from: () => ({ where: () => ({ limit: () => [mockUser] }) }),
      }));

      const result = await service.findById(mockUser.id);
      expect(result?.id).toBe(mockUser.id);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'test1@example.com',
          passwordHash: '$argon2hash',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          email: 'test2@example.com',
          passwordHash: '$argon2hash',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDb.select.mockImplementation(() => ({ from: () => mockUsers }));

      const result = await service.findAll();
      expect(result).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const updatedUser = {
        id: '123',
        email: 'new@example.com',
        passwordHash: '$hash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.update.mockImplementation(() => ({
        set: () => ({ where: () => ({ returning: () => [updatedUser] }) }),
      }));

      const result = await service.update('123', { email: 'new@example.com' });
      expect(result?.email).toBe('new@example.com');
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      mockDb.delete.mockImplementation(() => ({
        where: () => ({ returning: () => [{ id: '123' }] }),
      }));

      await expect(service.delete('123')).resolves.toBeUndefined();
    });
  });

  describe('getUserRoles', () => {
    it('should return role names for a user', async () => {
      mockDb.select.mockImplementation(() => ({
        from: () => ({
          innerJoin: () => ({
            where: () => [{ name: 'admin' }, { name: 'user' }],
          }),
        }),
      }));

      const result = await service.getUserRoles(
        '123e4567-e89b-12d3-a456-426614174000',
      );
      expect(result).toContain('admin');
    });
  });

  describe('getUserPermissions', () => {
    it('should return permissions for a user', async () => {
      mockDb.select.mockImplementation(() => ({
        from: () => ({
          innerJoin: () => ({
            innerJoin: () => ({ where: () => [{ permission: 'users:read' }] }),
          }),
        }),
      }));

      const result = await service.getUserPermissions(
        '123e4567-e89b-12d3-a456-426614174000',
      );
      expect(result).toContain('users:read');
    });
  });

  describe('findAllRoles', () => {
    it('should return all roles', async () => {
      mockDb.select.mockImplementation(() => ({
        from: () => [
          { id: '1', name: 'admin' },
          { id: '2', name: 'user' },
        ],
      }));

      expect(await service.findAllRoles()).toHaveLength(2);
    });
  });

  describe('findRoleById', () => {
    it('should return a role by id', async () => {
      mockDb.select.mockImplementation(() => ({
        from: () => ({
          where: () => ({ limit: () => [{ id: '123', name: 'admin' }] }),
        }),
      }));

      const result = await service.findRoleById('123');
      expect(result?.name).toBe('admin');
    });
  });

  describe('createRole', () => {
    it('should create a new role', async () => {
      mockDb.insert.mockImplementation(() => ({
        values: () => ({ returning: () => [{ id: '123', name: 'moderator' }] }),
      }));

      const result = await service.createRole({ name: 'moderator' });
      expect(result.name).toBe('moderator');
    });
  });

  describe('updateRole', () => {
    it('should update a role', async () => {
      mockDb.update.mockImplementation(() => ({
        set: () => ({
          where: () => ({
            returning: () => [
              { id: '123', name: 'admin', description: 'Updated' },
            ],
          }),
        }),
      }));

      const result = await service.updateRole('123', {
        description: 'Updated',
      });
      expect(result?.description).toBe('Updated');
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      mockDb.delete.mockImplementation(() => ({
        where: () => ({ returning: () => [{ id: '123' }] }),
      }));

      await expect(service.deleteRole('123')).resolves.toBeUndefined();
    });
  });

  describe('assignRole', () => {
    it('should assign a role to a user', async () => {
      mockDb.insert.mockImplementation(() => ({ values: () => ({}) }));

      await expect(
        service.assignRole('123e4567-e89b-12d3-a456-426614174000', '123'),
      ).resolves.toBeUndefined();
    });

    it('emits user.role-assigned event', async () => {
      mockDb.insert.mockImplementation(() => ({ values: () => ({}) }));

      await service.assignRole('user-id', 'role-id');

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('user.role-assigned', {
        userId: 'user-id',
        roleId: 'role-id',
      });
    });
  });

  describe('removeRole', () => {
    it('should remove a role from a user', async () => {
      mockDb.delete.mockImplementation(() => ({ where: () => ({}) }));

      await expect(
        service.removeRole('123e4567-e89b-12d3-a456-426614174000', '123'),
      ).resolves.toBeUndefined();
    });

    it('emits user.role-removed event', async () => {
      mockDb.delete.mockImplementation(() => ({ where: () => ({}) }));

      await service.removeRole('user-id', 'role-id');

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('user.role-removed', {
        userId: 'user-id',
        roleId: 'role-id',
      });
    });

    it('uses a combined user and role condition', async () => {
      const where = jest.fn();
      mockDb.delete.mockImplementation(() => ({ where }));

      await service.removeRole('user-id', 'role-id');

      const condition = where.mock.calls[0]?.[0];
      expect(condition.queryChunks[1].queryChunks[1].value).toEqual([' and ']);
    });
  });

  describe('setRolePermissions', () => {
    it('should set permissions for a role', async () => {
      mockDb.delete.mockImplementation(() => ({ where: () => ({}) }));
      mockDb.insert.mockImplementation(() => ({ values: () => ({}) }));

      await expect(
        service.setRolePermissions('123', ['users:read']),
      ).resolves.toBeUndefined();
    });
  });
});
