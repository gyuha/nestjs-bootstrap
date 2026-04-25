import type { OAuthServiceInterface } from '../../domain/services/oauth.service.interface';
import { OAuthProvider } from '../../domain/value-objects/oauth-provider.value-object';
import type { OAuthUserInfo } from '../../domain/entities/auth.entity';
export declare class OAuthKakaoService implements OAuthServiceInterface {
    private readonly clientId;
    private readonly redirectUri;
    getAuthUrl(provider: OAuthProvider): string;
    getUserInfo(provider: OAuthProvider, code: string): Promise<OAuthUserInfo>;
}
