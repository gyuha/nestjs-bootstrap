import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { socialAccounts } from '../../shared/infrastructure/database/database.schema';
import { DRIZZLE_CLIENT } from '../../shared/infrastructure/database/database.token';
import { UsersService } from '../users/users.service';

@Injectable()
export class SocialService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: NodePgDatabase,
    private readonly usersService: UsersService,
  ) {}

  async findOrCreateUser(dto: {
    provider: 'google' | 'github';
    providerId: string;
    email: string;
  }) {
    // Already linked social account
    const existing = await this.db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.providerId, dto.providerId))
      .limit(1);

    if (existing[0]) {
      return this.usersService.findById(existing[0].userId);
    }

    // Check if email exists
    const userByEmail = await this.usersService.findByEmail(dto.email);

    if (userByEmail) {
      await this.db.insert(socialAccounts).values({
        userId: userByEmail.id,
        provider: dto.provider,
        providerId: dto.providerId,
      });
      return userByEmail;
    }

    // Create new user
    const newUser = await this.usersService.create({ email: dto.email });
    await this.db.insert(socialAccounts).values({
      userId: newUser.id,
      provider: dto.provider,
      providerId: dto.providerId,
    });
    return newUser;
  }
}
