import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { SocialService } from '../../social/social.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly socialService: SocialService,
    private readonly config: ConfigService,
  ) {
    super({
      clientID: config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: `${config.getOrThrow<string>('API_BASE_URL')}/auth/google/callback`,
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
