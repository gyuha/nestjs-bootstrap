import type { RedisService } from "../../../../infrastructure/redis/redis.service";
import type { DrizzleService } from "../../../../infrastructure/database/drizzle.service";
import type { AuthTokenRepositoryInterface } from "../../domain/repositories/auth-token.repository.interface";
import type { RefreshTokenRecord } from "../../domain/value-objects/token.value-object";
export declare class RedisPostgresTokenRepository implements AuthTokenRepositoryInterface {
  private readonly redis;
  private readonly db;
  constructor(redis: RedisService, db: DrizzleService);
  storeRefreshToken(
    tokenHash: string,
    userId: string,
    deviceInfo: string | null,
    expiresAt: Date,
  ): Promise<void>;
  validateRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revokeRefreshToken(tokenHash: string): Promise<void>;
  revokeAllUserTokens(userId: string): Promise<void>;
}
