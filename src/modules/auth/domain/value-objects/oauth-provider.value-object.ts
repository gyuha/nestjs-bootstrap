export enum OAuthProvider {
  GOOGLE = 'GOOGLE',
  KAKAO = 'KAKAO',
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}
