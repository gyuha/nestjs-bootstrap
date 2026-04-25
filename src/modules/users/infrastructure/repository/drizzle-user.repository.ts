import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DrizzleService } from '../../../../infrastructure/database/drizzle.service';
import { users, type User, type NewUser } from '../../../../infrastructure/database/schema/users.schema';
import { UserEntity, Role, UserStatus } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repository/user.repository.interface';
import { oauthAccounts } from '../../../../infrastructure/database/schema/oauth-accounts.schema';

function toUserEntity(result: User): UserEntity {
  return {
    id: result.id,
    email: result.email,
    passwordHash: result.passwordHash,
    name: result.name,
    role: result.role as Role,
    status: result.status as UserStatus,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}

@Injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: DrizzleService) {}

  async findById(id: string): Promise<UserEntity | null> {
    const result = await this.db.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] ? toUserEntity(result[0]) : null;
  }

  async findActiveById(id: string): Promise<UserEntity | null> {
    const result = await this.db.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.status, UserStatus.ACTIVE)))
      .limit(1);
    return result[0] ? toUserEntity(result[0]) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.db.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] ? toUserEntity(result[0]) : null;
  }

  async findByOAuthProvider(provider: string, providerUserId: string): Promise<UserEntity | null> {
    const result = await this.db.db
      .select({ user: users })
      .from(oauthAccounts)
      .innerJoin(users, eq(oauthAccounts.userId, users.id))
      .where(
        and(
          eq(oauthAccounts.provider, provider as any),
          eq(oauthAccounts.providerUserId, providerUserId),
        ),
      )
      .limit(1);
    return result[0]?.user ? toUserEntity(result[0].user) : null;
  }

  async save(entity: UserEntity): Promise<void> {
    const newUser: NewUser = {
      email: entity.email,
      passwordHash: entity.passwordHash,
      name: entity.name,
      role: entity.role,
      status: entity.status,
    };
    await this.db.db.insert(users).values(newUser);
  }

  async update(entity: UserEntity): Promise<void> {
    const { id, ...data } = entity;
    await this.db.db.update(users).set(data).where(eq(users.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.db.delete(users).where(eq(users.id, id));
  }
}