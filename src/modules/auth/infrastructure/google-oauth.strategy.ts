import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "@nestjs/passport";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, type Profile, type VerifyCallback } from "passport-google-oauth20";
import type { GoogleLoginInput } from "../application/google-login.use-case";

type GoogleJsonProfile = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(Strategy, "google") {
  constructor(@Inject(ConfigService) config: ConfigService) {
    super({
      clientID: config.getOrThrow<string>("auth.google.clientId"),
      clientSecret: config.getOrThrow<string>("auth.google.clientSecret"),
      callbackURL: config.getOrThrow<string>("auth.google.callbackUrl"),
      scope: ["email", "profile"],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const json = profile._json as GoogleJsonProfile;
    const email = json.email ?? profile.emails?.[0]?.value;
    const providerUserId = json.sub ?? profile.id;
    const displayName = json.name ?? profile.displayName;

    if (!providerUserId || !email || !displayName) {
      done(new Error("Google profile is missing required fields"));
      return;
    }

    const user: GoogleLoginInput = {
      providerUserId,
      email,
      emailVerified: json.email_verified ?? false,
      displayName,
      avatarUrl: json.picture ?? profile.photos?.[0]?.value ?? null,
    };

    done(null, user);
  }
}

@Injectable()
export class GoogleAuthGuard extends AuthGuard("google") {}
