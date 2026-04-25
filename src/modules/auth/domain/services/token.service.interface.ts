import type { TokenPair, JwtPayload } from '../value-objects/token.value-object';

export interface TokenServiceInterface {
  generateAccessToken(userId: string, email: string, role: string): string;
  verifyAccessToken(token: string): JwtPayload;
  generateRefreshToken(): string;
  hashToken(token: string): string;
  generateTokenPair(userId: string, email: string, role: string): Promise<TokenPair>;
}
