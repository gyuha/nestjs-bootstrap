import { and, eq, gt, isNull } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  CreateRefreshTokenRepositoryInput,
  RefreshToken,
  RefreshTokenRotation,
  RefreshTokenRepository,
  RotateRefreshTokenRepositoryInput,
} from "../domain/refresh-token.repository";
import { RefreshTokenRotationError } from "../domain/refresh-token.repository";
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

  async rotate(
    currentTokenHash: string,
    replacement: RotateRefreshTokenRepositoryInput,
  ): Promise<RefreshTokenRotation> {
    return this.db.transaction(async (tx) => {
      const [currentToken] = await tx
        .select()
        .from(refreshTokens)
        .where(
          and(
            eq(refreshTokens.tokenHash, currentTokenHash),
            isNull(refreshTokens.revokedAt),
            gt(refreshTokens.expiresAt, new Date()),
          ),
        )
        .limit(1)
        .for("update");

      if (!currentToken) {
        throw new RefreshTokenRotationError();
      }

      const [replacementToken] = await tx
        .insert(refreshTokens)
        .values({
          userId: currentToken.userId,
          tokenHash: replacement.tokenHash,
          expiresAt: replacement.expiresAt,
          userAgent: replacement.userAgent,
          ipAddress: replacement.ipAddress,
        })
        .returning();

      const [revokedCurrentToken] = await tx
        .update(refreshTokens)
        .set({
          revokedAt: new Date(),
          replacedByTokenId: replacementToken.id,
        })
        .where(and(eq(refreshTokens.id, currentToken.id), isNull(refreshTokens.revokedAt)))
        .returning();

      if (!revokedCurrentToken) {
        throw new RefreshTokenRotationError();
      }

      return {
        currentToken: this.toDomain(revokedCurrentToken),
        replacementToken: this.toDomain(replacementToken),
      };
    });
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
