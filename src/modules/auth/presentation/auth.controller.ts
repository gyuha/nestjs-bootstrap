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
import { ApiBearerAuth, ApiBody, ApiTags } from "@nestjs/swagger";
import type { GoogleLoginInput } from "../application/google-login.use-case";
import { GoogleLogin } from "../application/google-login.use-case";
import {
  GetAuthenticatedUser,
  LoginWithPassword,
  LogoutSession,
  RefreshSession,
  RegisterWithPassword,
} from "../application/auth.use-cases";
import {
  InactiveUserAuthError,
  InvalidAuthCredentialsError,
  InvalidRefreshTokenError,
} from "../application/auth.errors";
import { GoogleAuthGuard } from "../infrastructure/google-oauth.strategy";
import { CurrentUser } from "./current-user.decorator";
import { JwtAuthGuard } from "./jwt-auth.guard";
import type { AuthenticatedUser } from "./request-user";
import {
  LoginWithPasswordDto,
  LogoutSessionDto,
  RefreshSessionDto,
  RegisterWithPasswordDto,
} from "./dto/auth.dto";

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
  async register(@Body() body: RegisterWithPasswordDto) {
    return this.runAuth(() => this.registerWithPassword.execute(body));
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginWithPasswordDto })
  async login(@Body() body: LoginWithPasswordDto) {
    return this.runAuth(() => this.loginWithPassword.execute(body));
  }

  @Get("google")
  @UseGuards(GoogleAuthGuard)
  async google(): Promise<void> {}

  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@CurrentUser() profile: GoogleLoginInput) {
    return this.runAuth(() => this.googleLogin.execute(profile));
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RefreshSessionDto })
  async refresh(@Body() body: RefreshSessionDto) {
    return this.runAuth(() => this.refreshSession.execute(body));
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LogoutSessionDto })
  async logout(@Body() body: LogoutSessionDto) {
    await this.logoutSession.execute(body);

    return { loggedOut: true };
  }

  @Get("me")
  @ApiBearerAuth()
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
