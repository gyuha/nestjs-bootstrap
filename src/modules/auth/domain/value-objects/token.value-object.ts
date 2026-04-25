export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRecord {
  tokenHash: string;
  userId: string;
  deviceInfo: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
}
