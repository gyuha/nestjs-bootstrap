import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { type ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard, PassportStrategy } from "@nestjs/passport";
import type { Request, Response } from "express";
import { type Profile, Strategy, type VerifyCallback } from "passport-google-oauth20";
import type { GoogleLoginInput } from "../application/google-login.use-case";

type GoogleJsonProfile = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

const oauthStateCookieName = "google_oauth_state";
const oauthStateMaxAgeSeconds = 300;

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
export class GoogleAuthGuard extends AuthGuard("google") {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    if (this.isCallbackRequest(request)) {
      this.verifyCallbackState(request);
      this.clearStateCookie(response);
    }

    const activated = await super.canActivate(context);
    return Boolean(activated);
  }

  override getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    if (this.isCallbackRequest(request)) {
      return undefined;
    }

    const state = this.createState();
    this.setStateCookie(response, state);

    return { state };
  }

  private createState(): string {
    const payload = `${Date.now()}.${randomBytes(16).toString("base64url")}`;
    const signature = this.signStatePayload(payload);

    return `${payload}.${signature}`;
  }

  private verifyCallbackState(request: Request): void {
    const state = typeof request.query.state === "string" ? request.query.state : null;
    const cookieState = this.getCookie(request, oauthStateCookieName);

    if (!state || !cookieState || state !== cookieState || !this.isValidState(state)) {
      throw new UnauthorizedException("Invalid OAuth state");
    }
  }

  private isValidState(state: string): boolean {
    const parts = state.split(".");

    if (parts.length !== 3) {
      return false;
    }

    const [timestampValue, nonce, signature] = parts;
    const timestamp = Number(timestampValue);

    if (!Number.isSafeInteger(timestamp) || !nonce) {
      return false;
    }

    if (Date.now() - timestamp > oauthStateMaxAgeSeconds * 1_000) {
      return false;
    }

    const expected = this.signStatePayload(`${timestampValue}.${nonce}`);
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(signature);

    return (
      expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)
    );
  }

  private signStatePayload(payload: string): string {
    return createHmac("sha256", this.config.getOrThrow<string>("auth.accessTokenSecret"))
      .update(payload)
      .digest("base64url");
  }

  private isCallbackRequest(request: Request): boolean {
    return request.path.endsWith("/auth/google/callback");
  }

  private setStateCookie(response: Response, state: string): void {
    const secure = this.config.get<string>("app.env") === "production" ? "; Secure" : "";
    response.setHeader(
      "set-cookie",
      `${oauthStateCookieName}=${encodeURIComponent(
        state,
      )}; Max-Age=${oauthStateMaxAgeSeconds}; Path=/api/v1/auth/google; HttpOnly; SameSite=Lax${secure}`,
    );
  }

  private clearStateCookie(response: Response): void {
    response.setHeader(
      "set-cookie",
      `${oauthStateCookieName}=; Max-Age=0; Path=/api/v1/auth/google; HttpOnly; SameSite=Lax`,
    );
  }

  private getCookie(request: Request, name: string): string | null {
    const cookieHeader = request.headers.cookie;

    if (!cookieHeader) {
      return null;
    }

    const cookie = cookieHeader
      .split(";")
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${name}=`));

    return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
  }
}
