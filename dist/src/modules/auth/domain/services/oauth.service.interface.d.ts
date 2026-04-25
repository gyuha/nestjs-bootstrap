import { type OAuthProvider } from '../value-objects/oauth-provider.value-object';
import type { OAuthUserInfo } from '../entities/auth.entity';
export interface OAuthServiceInterface {
    getUserInfo(provider: OAuthProvider, code: string): Promise<OAuthUserInfo>;
    getAuthUrl(provider: OAuthProvider): string;
}
