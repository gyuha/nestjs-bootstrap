import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SubscribeDto } from './dto/subscribe.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  login(
    @Body() dto: LoginDto,
    @CurrentUser() user: { userId: string; email: string },
    @Req() req: Request,
  ) {
    const ip = req.ip ?? 'unknown';
    const userAgent = req.headers['user-agent'] ?? 'unknown';
    return this.authService.login(dto, user, ip, userAgent);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate refresh tokens' })
  async logout(@CurrentUser('userId') userId: string) {
    await this.authService.logout(userId);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset email' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address with token' })
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current authenticated user' })
  me(@CurrentUser() user: { userId: string; email: string }) {
    return user;
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subscribe to marketing emails' })
  subscribe(@Body() dto: SubscribeDto) {
    return this.authService.subscribeMarketing(dto.email);
  }

  @Get('subscribe/confirm')
  @ApiOperation({ summary: 'Confirm marketing subscription' })
  confirmSubscription(@Query('token') token: string) {
    return this.authService.confirmSubscription(token);
  }

  @Get('unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from marketing emails' })
  unsubscribe(@Query('token') token: string) {
    return this.authService.unsubscribeMarketing(token);
  }
}
