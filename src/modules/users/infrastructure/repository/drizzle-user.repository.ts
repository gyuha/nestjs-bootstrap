import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DrizzleService } from '../../../../infrastructure/database/drizzle.service';
import { users } from '../../../../infrastructure/database/schema/users.schema';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserStatus } from '../../domain/value-objects/role.value-object';
import { UserRepository } from '../../domain/repository/user.repository.interface';
import { oauthAccounts } from '../../../../infrastructure/database/schema/oauth-accounts.schema';

@Injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: DrizzleService) {}

  async findById(id: string): Promise<UserEntity | null> {
    const result = await this.db.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async findActiveById(id: string): Promise<UserEntity | null> {
    const result = await this.db.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.status, UserStatus.ACTIVE)))
      .limit(1);
    return result[0] || null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.db.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
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
    return result[0]?.user || null;
  }

  async save(entity: UserEntity): Promise<void> {
    await this.db.db.insert(users, entity);
  }

  async update(entity: UserEntity): Promise<void> {
    const { id, ...data } = entity;
    await this.db.db.update(users).set(data).where(eq(users.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.db.delete(users).where(eq(users.id, id));
  }
}