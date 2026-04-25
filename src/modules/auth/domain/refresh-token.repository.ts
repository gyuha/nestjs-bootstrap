export const REFRESH_TOKEN_REPOSITORY = Symbol("REFRESH_TOKEN_REPOSITORY");

export type RefreshToken = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
};

export type CreateRefreshTokenRepositoryInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
};

export interface RefreshTokenRepository {
  create(input: CreateRefreshTokenRepositoryInput): Promise<RefreshToken>;
  findValidByHash(tokenHash: string): Promise<RefreshToken | null>;
  revoke(tokenId: string, replacedByTokenId: string | null): Promise<RefreshToken>;
  revokeAllForUser(userId: string): Promise<void>;
}
