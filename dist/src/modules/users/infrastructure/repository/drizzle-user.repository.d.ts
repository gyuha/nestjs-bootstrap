import type { DrizzleService } from "../../../../infrastructure/database/drizzle.service";
import { type UserEntity } from "../../domain/entities/user.entity";
import type { UserRepository } from "../../domain/repository/user.repository.interface";
export declare class DrizzleUserRepository implements UserRepository {
  private readonly db;
  constructor(db: DrizzleService);
  findById(id: string): Promise<UserEntity | null>;
  findActiveById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByOAuthProvider(provider: string, providerUserId: string): Promise<UserEntity | null>;
  save(entity: UserEntity): Promise<void>;
  update(entity: UserEntity): Promise<void>;
  delete(id: string): Promise<void>;
}
