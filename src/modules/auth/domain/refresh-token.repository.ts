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

export type RotateRefreshTokenRepositoryInput = {
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
};

export type RefreshTokenRotation = {
  currentToken: RefreshToken;
  replacementToken: RefreshToken;
};

export class RefreshTokenRotationError extends Error {
  constructor(message = "Refresh token cannot be rotated") {
    super(message);
    this.name = "RefreshTokenRotationError";
  }
}

export interface RefreshTokenRepository {
  create(input: CreateRefreshTokenRepositoryInput): Promise<RefreshToken>;
  findValidByHash(tokenHash: string): Promise<RefreshToken | null>;
  rotate(
    currentTokenHash: string,
    replacement: RotateRefreshTokenRepositoryInput,
  ): Promise<RefreshTokenRotation>;
  revoke(tokenId: string, replacedByTokenId: string | null): Promise<RefreshToken>;
  revokeAllForUser(userId: string): Promise<void>;
}
