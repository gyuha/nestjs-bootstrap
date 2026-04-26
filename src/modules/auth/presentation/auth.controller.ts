import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import {
  InactiveUserAuthError,
  InvalidAuthCredentialsError,
  InvalidRefreshTokenError,
} from "../application/auth.errors";
import {
  GetAuthenticatedUser,
  LoginWithPassword,
  LogoutSession,
  RefreshSession,
  RegisterWithPassword,
} from "../application/auth.use-cases";
import type { GoogleLoginInput } from "../application/google-login.use-case";
import { GoogleLogin } from "../application/google-login.use-case";
import { GoogleAuthGuard } from "../infrastructure/google-oauth.strategy";
import { CurrentUser } from "./current-user.decorator";
import {
  LoginWithPasswordDto,
  LogoutSessionDto,
  RefreshSessionDto,
  RegisterWithPasswordDto,
} from "./dto/auth.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import type { AuthenticatedUser } from "./request-user";

@ApiTags("auth")
@Controller({ path: "auth", version: "1" })
export class AuthController {
  @Inject(RegisterWithPassword)
  private readonly registerWithPassword!: RegisterWithPassword;

  @Inject(LoginWithPassword)
  private readonly loginWithPassword!: LoginWithPassword;

  @Inject(GoogleLogin)
  private readonly googleLogin!: GoogleLogin;

  @Inject(RefreshSession)
  private readonly refreshSession!: RefreshSession;

  @Inject(LogoutSession)
  private readonly logoutSession!: LogoutSession;

  @Inject(GetAuthenticatedUser)
  private readonly getAuthenticatedUser!: GetAuthenticatedUser;

  @Post("register")
  @ApiBody({ type: RegisterWithPasswordDto })
  @ApiOperation({ summary: "Register with email and password" })
  @ApiCreatedResponse({ description: "Returns an access token, refresh token, and user profile." })
  @ApiUnauthorizedResponse({ description: "The user is inactive or credentials are invalid." })
  async register(@Body() body: RegisterWithPasswordDto) {
    return this.runAuth(() => this.registerWithPassword.execute(body));
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginWithPasswordDto })
  @ApiOperation({ summary: "Log in with email and password" })
  @ApiOkResponse({ description: "Returns an access token, refresh token, and user profile." })
  @ApiUnauthorizedResponse({ description: "Credentials are invalid or the user is inactive." })
  async login(@Body() body: LoginWithPasswordDto) {
    return this.runAuth(() => this.loginWithPassword.execute(body));
  }

  @Get("google")
  @ApiOperation({ summary: "Start Google OAuth login" })
  @ApiFoundResponse({ description: "Redirects to Google's OAuth consent flow." })
  @UseGuards(GoogleAuthGuard)
  async google(): Promise<void> {}

  @Get("google/callback")
  @ApiOperation({ summary: "Complete Google OAuth login" })
  @ApiOkResponse({ description: "Returns an access token, refresh token, and user profile." })
  @ApiUnauthorizedResponse({ description: "The Google profile could not be authenticated." })
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@CurrentUser() profile: GoogleLoginInput) {
    return this.runAuth(() => this.googleLogin.execute(profile));
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RefreshSessionDto })
  @ApiOperation({ summary: "Rotate a refresh token" })
  @ApiOkResponse({ description: "Returns a new access token and replacement refresh token." })
  @ApiUnauthorizedResponse({ description: "The refresh token is missing, expired, or revoked." })
  async refresh(@Body() body: RefreshSessionDto) {
    return this.runAuth(() => this.refreshSession.execute(body));
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LogoutSessionDto })
  @ApiOperation({ summary: "Revoke a refresh token" })
  @ApiOkResponse({ description: "Refresh token revoked." })
  async logout(@Body() body: LogoutSessionDto) {
    await this.logoutSession.execute(body);

    return { loggedOut: true };
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the authenticated user from a bearer token" })
  @ApiOkResponse({ description: "Returns the authenticated user profile." })
  @ApiUnauthorizedResponse({ description: "Bearer token is missing or invalid." })
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.runAuth(() => this.getAuthenticatedUser.execute(user.id));
  }

  private async runAuth<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (
        error instanceof InvalidAuthCredentialsError ||
        error instanceof InvalidRefreshTokenError ||
        error instanceof InactiveUserAuthError
      ) {
        throw new UnauthorizedException(error.message);
      }

      throw error;
    }
  }
}
