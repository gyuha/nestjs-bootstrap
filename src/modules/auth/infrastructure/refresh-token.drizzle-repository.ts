import { and, eq, gt, isNull } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  CreateRefreshTokenRepositoryInput,
  RefreshToken,
  RefreshTokenRepository,
} from "../domain/refresh-token.repository";
import { refreshTokens, type schema } from "../../../shared/infrastructure/database/schema";

type Database = NodePgDatabase<typeof schema>;
type RefreshTokenRow = typeof refreshTokens.$inferSelect;

export class DrizzleRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateRefreshTokenRepositoryInput): Promise<RefreshToken> {
    const [row] = await this.db
      .insert(refreshTokens)
      .values({
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
      })
      .returning();

    return this.toDomain(row);
  }

  async findValidByHash(tokenHash: string): Promise<RefreshToken | null> {
    const [row] = await this.db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return row ? this.toDomain(row) : null;
  }

  async revoke(tokenId: string, replacedByTokenId: string | null): Promise<RefreshToken> {
    const [row] = await this.db
      .update(refreshTokens)
      .set({
        revokedAt: new Date(),
        replacedByTokenId,
      })
      .where(and(eq(refreshTokens.id, tokenId), isNull(refreshTokens.revokedAt)))
      .returning();

    if (row) {
      return this.toDomain(row);
    }

    const [existing] = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.id, tokenId))
      .limit(1);

    if (!existing) {
      throw new Error(`Refresh token not found: ${tokenId}`);
    }

    return this.toDomain(existing);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
  }

  private toDomain(row: RefreshTokenRow): RefreshToken {
    return {
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      replacedByTokenId: row.replacedByTokenId,
      userAgent: row.userAgent,
      ipAddress: row.ipAddress,
      createdAt: row.createdAt,
    };
  }
}
