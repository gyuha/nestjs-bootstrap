import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { SocialService } from '../../social/social.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly socialService: SocialService,
    config: ConfigService,
  ) {
    super({
      clientID: config.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: `${config.getOrThrow<string>('API_BASE_URL')}/auth/github/callback`,
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      username?: string;
      emails?: { value: string }[];
    },
  ) {
    const email =
      profile.emails?.[0]?.value ?? `${profile.username}@github.placeholder`;
    return this.socialService.findOrCreateUser({
      provider: 'github',
      providerId: profile.id,
      email,
    });
  }
}
