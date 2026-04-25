import { Injectable } from '@nestjs/common';
import type { OAuthServiceInterface } from '../../domain/services/oauth.service.interface';
import { OAuthProvider } from '../../domain/value-objects/oauth-provider.value-object';
import type { OAuthUserInfo } from '../../domain/entities/auth.entity';
import axios from 'axios';

@Injectable()
export class OAuthKakaoService implements OAuthServiceInterface {
  private readonly clientId = process.env.KAKAO_CLIENT_ID!;
  private readonly redirectUri = process.env.KAKAO_REDIRECT_URI!;

  getAuthUrl(provider: OAuthProvider): string {
    if (provider !== OAuthProvider.KAKAO) throw new Error('Invalid provider');
    return `https://kauth.kakao.com/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&response_type=code`;
  }

  async getUserInfo(provider: OAuthProvider, code: string): Promise<OAuthUserInfo> {
    if (provider !== OAuthProvider.KAKAO) throw new Error('Invalid provider');

    const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        code,
      },
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    const userInfoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { id, kakao_account } = userInfoResponse.data;
    const email = kakao_account.email;
    const name = kakao_account.profile?.nickname || 'Unknown';

    return {
      provider: OAuthProvider.KAKAO,
      providerUserId: String(id),
      email,
      name,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
    };
  }
}