import { RefreshTokenRecord } from '../value-objects/token.value-object';

export interface AuthTokenRepositoryInterface {
  storeRefreshToken(tokenHash: string, userId: string, deviceInfo: string | null, expiresAt: Date): Promise<void>;
  validateRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revokeRefreshToken(tokenHash: string): Promise<void>;
  revokeAllUserTokens(userId: string): Promise<void>;
}
