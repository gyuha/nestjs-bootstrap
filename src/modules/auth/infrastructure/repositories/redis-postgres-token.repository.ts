import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../../infrastructure/redis/redis.service';
import { DrizzleService } from '../../../../infrastructure/database/drizzle.service';
import { refreshTokens } from '../../../../infrastructure/database/schema/refresh-tokens.schema';
import { AuthTokenRepositoryInterface } from '../../domain/repositories/auth-token.repository.interface';
import { RefreshTokenRecord } from '../../domain/value-objects/token.value-object';
import { eq, and, isNull } from 'drizzle-orm';

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

@Injectable()
export class RedisPostgresTokenRepository implements AuthTokenRepositoryInterface {
  constructor(
    private readonly redis: RedisService,
    private readonly db: DrizzleService,
  ) {}

  async storeRefreshToken(tokenHash: string, userId: string, deviceInfo: string | null, expiresAt: Date): Promise<void> {
    // Store in Redis for fast validation
    await this.redis.set(`refresh:${tokenHash}`, userId, REFRESH_TOKEN_TTL);

    // Store metadata in PostgreSQL for revocation/audit
    await this.db.db.insert(refreshTokens, {
      tokenHash,
      userId,
      deviceInfo,
      expiresAt,
    });
  }

  async validateRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null> {
    // First check Redis
    const userId = await this.redis.get(`refresh:${tokenHash}`);
    if (userId) {
      // Check PostgreSQL for non-revoked record
      const records = await this.db.db
        .select()
        .from(refreshTokens)
        .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt)))
        .limit(1);
      const record = records[0];
      if (record && record.expiresAt > new Date()) {
        return {
          tokenHash: record.tokenHash,
          userId: record.userId,
          deviceInfo: record.deviceInfo,
          expiresAt: record.expiresAt,
          revokedAt: record.revokedAt,
        };
      }
    }
    return null;
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    // Remove from Redis
    await this.redis.del(`refresh:${tokenHash}`);
    // Mark as revoked in PostgreSQL
    await this.db.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, tokenHash));
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    // Get all user's tokens from PostgreSQL
    const tokens = await this.db.db
      .select({ tokenHash: refreshTokens.tokenHash })
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, userId));

    // Remove from Redis
    for (const token of tokens) {
      await this.redis.del(`refresh:${token.tokenHash}`);
    }

    // Mark all as revoked in PostgreSQL
    await this.db.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.userId, userId));
  }
}