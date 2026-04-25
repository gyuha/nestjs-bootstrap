import type { UserEntity } from '../../modules/users/domain/entities/user.entity';
export declare function createTestUser(overrides?: Partial<UserEntity>): UserEntity;
export declare function createTestAdmin(overrides?: Partial<UserEntity>): UserEntity;
