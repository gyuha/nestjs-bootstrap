import { Injectable, Optional } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import type { SocialService } from '../../social/social.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly socialService: SocialService,
    @Optional() private readonly config: ConfigService,
  ) {
    const clientID = config?.get<string>('GOOGLE_CLIENT_ID') ?? 'dummy';
    const clientSecret = config?.get<string>('GOOGLE_CLIENT_SECRET') ?? 'dummy';
    const apiBaseUrl =
      config?.get<string>('API_BASE_URL') ?? 'http://localhost';
    const callbackURL =
      clientID === 'dummy'
        ? 'http://localhost/auth/google/callback'
        : `${apiBaseUrl}/auth/google/callback`;

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: { id: string; emails: { value: string }[] },
  ) {
    const email = profile.emails[0]?.value;
    if (!email) throw new Error('No email in Google profile');
    return this.socialService.findOrCreateUser({
      provider: 'google',
      providerId: profile.id,
      email,
    });
  }
}
