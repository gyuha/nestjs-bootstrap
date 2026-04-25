import { Controller, Post, Body, UseGuards, Req, UseInterceptors, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AuthApplicationService } from '../application/auth-application.service';
import {
  type LoginPasswordDto,
  type LoginOAuthDto,
  type RefreshTokenDto,
  type RegisterDto,
  type ResendVerificationDto,
  type ForgotPasswordDto,
  type ResetPasswordDto,
  type MagicLinkRequestDto,
  AuthResponseDto,
  TokenRefreshResponseDto,
} from '../application/dto/auth.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ResponseEnvelopeInterceptor } from '../../../shared/presentation/interceptors/response-envelope.interceptor';
import { Request } from 'express';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Forbidden' })
@UseInterceptors(ResponseEnvelopeInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthApplicationService) {}

  @Public()
  @Post('login/password')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async loginPassword(@Body() dto: LoginPasswordDto): Promise<AuthResponseDto> {
    const result = await this.authService.loginWithPassword(dto.email, dto.password);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
  }

  @Public()
  @Post('login/oauth/:provider')
  @ApiOperation({ summary: 'Login with OAuth provider' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'OAuth authentication failed' })
  async loginOAuth(@Body() dto: LoginOAuthDto): Promise<AuthResponseDto> {
    const result = await this.authService.loginWithOAuth(dto.provider, dto.code);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, type: TokenRefreshResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() dto: RefreshTokenDto): Promise<TokenRefreshResponseDto> {
    const tokenPair = await this.authService.refreshToken(dto.refreshToken);
    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
    };
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Weak password' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    const result = await this.authService.register(dto);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
  }

  @Public()
  @Get('verify-email/:token')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Param('token') token: string): Promise<{ message: string }> {
    await this.authService.verifyEmail(token);
    return { message: 'Email verified successfully' };
  }

  @Public()
  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  async resendVerification(@Body() dto: ResendVerificationDto): Promise<{ message: string }> {
    await this.authService.resendVerificationEmail(dto.email);
    return { message: 'Verification email sent' };
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({ status: 200 })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.forgotPassword(dto.email);
    return { message: 'If the email exists, a reset link has been sent' };
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200 })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password reset successfully' };
  }

  @Public()
  @Post('magic-link')
  @ApiOperation({ summary: 'Request magic link' })
  @ApiResponse({ status: 200 })
  async requestMagicLink(@Body() dto: MagicLinkRequestDto): Promise<{ message: string }> {
    await this.authService.requestMagicLink(dto.email);
    return { message: 'If the email exists, a magic link has been sent' };
  }

  @Public()
  @Get('magic-link/:token')
  @ApiOperation({ summary: 'Login with magic link' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async loginWithMagicLink(@Param('token') token: string): Promise<AuthResponseDto> {
    const result = await this.authService.loginWithMagicLink(token);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
  }
}
