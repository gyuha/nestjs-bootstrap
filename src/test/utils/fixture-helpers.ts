import { UserEntity } from '../../modules/users/domain/entities/user.entity';
import { Role, UserStatus } from '../../modules/users/domain/value-objects/role.value-object';

export function createTestUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    passwordHash: '$2b$12$hashedpassword',
    name: 'Test User',
    role: Role.USER,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestAdmin(overrides: Partial<UserEntity> = {}): UserEntity {
  return createTestUser({ role: Role.ADMIN, ...overrides });
}