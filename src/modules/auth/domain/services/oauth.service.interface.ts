import { OAuthProvider, OAuthTokens } from '../value-objects/oauth-provider.value-object';
import { OAuthUserInfo } from '../entities/auth.entity';

export interface OAuthServiceInterface {
  getUserInfo(provider: OAuthProvider, code: string): Promise<OAuthUserInfo>;
  getAuthUrl(provider: OAuthProvider): string;
}
