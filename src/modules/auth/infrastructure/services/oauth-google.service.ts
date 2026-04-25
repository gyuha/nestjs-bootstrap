import { Injectable } from '@nestjs/common';
import { OAuthServiceInterface } from '../../domain/services/oauth.service.interface';
import { OAuthProvider } from '../../domain/value-objects/oauth-provider.value-object';
import { OAuthUserInfo } from '../../domain/entities/auth.entity';
import axios from 'axios';

@Injectable()
export class OAuthGoogleService implements OAuthServiceInterface {
  private readonly clientId = process.env.GOOGLE_CLIENT_ID!;
  private readonly clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  private readonly redirectUri = process.env.GOOGLE_REDIRECT_URI!;

  getAuthUrl(provider: OAuthProvider): string {
    if (provider !== OAuthProvider.GOOGLE) throw new Error('Invalid provider');
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&response_type=code&scope=email%20profile`;
  }

  async getUserInfo(provider: OAuthProvider, code: string): Promise<OAuthUserInfo> {
    if (provider !== OAuthProvider.GOOGLE) throw new Error('Invalid provider');

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code',
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { id, email, name } = userInfoResponse.data;

    return {
      provider: OAuthProvider.GOOGLE,
      providerUserId: id,
      email,
      name,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
    };
  }
}