import type { BaseRepository } from '../../../../shared/domain/repository/base-repository.interface';
import type { UserEntity } from '../entities/user.entity';

export interface UserRepository extends BaseRepository<UserEntity, string> {
  findByEmail(email: string): Promise<UserEntity | null>;
  findByOAuthProvider(provider: string, providerUserId: string): Promise<UserEntity | null>;
  findActiveById(id: string): Promise<UserEntity | null>;
}