import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { SocialService } from '../../social/social.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly socialService: SocialService,
    @Optional() private readonly config: ConfigService,
  ) {
    const clientID = config?.get<string>('GITHUB_CLIENT_ID') ?? 'dummy';
    const clientSecret = config?.get<string>('GITHUB_CLIENT_SECRET') ?? 'dummy';
    const apiBaseUrl =
      config?.get<string>('API_BASE_URL') ?? 'http://localhost';
    const callbackURL =
      clientID === 'dummy'
        ? 'http://localhost/auth/github/callback'
        : `${apiBaseUrl}/auth/github/callback`;

    super({
      clientID,
      clientSecret,
      callbackURL,
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
