import { Controller, Post, Body, UseGuards, Req, UseInterceptors } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthApplicationService } from '../application/auth-application.service';
import {
  LoginPasswordDto,
  LoginOAuthDto,
  RefreshTokenDto,
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
}
