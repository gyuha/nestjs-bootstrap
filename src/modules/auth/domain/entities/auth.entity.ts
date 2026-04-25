import { OAuthProvider } from '../value-objects/oauth-provider.value-object';

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface OAuthUserInfo {
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  name: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}
