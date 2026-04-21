import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SubscribeDto } from './dto/subscribe.dto';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
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
  async logout(@CurrentUser('userId') userId: string) {
    await this.authService.logout(userId);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { userId: string; email: string }) {
    return user;
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  subscribe(@Body() dto: SubscribeDto) {
    return this.authService.subscribeMarketing(dto.email);
  }

  @Get('subscribe/confirm')
  confirmSubscription(@Query('token') token: string) {
    return this.authService.confirmSubscription(token);
  }

  @Get('unsubscribe')
  unsubscribe(@Query('token') token: string) {
    return this.authService.unsubscribeMarketing(token);
  }
}
