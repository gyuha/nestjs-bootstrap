import { Controller, Get, UseGuards, Res, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from '../auth/auth.service';

@Controller('auth')
export class SocialController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthCallback(
    @Req() req: Request & { user: { id: string; email: string } },
    @Res() res: Response,
  ) {
    const tokens = this.authService.generateTokensForUser(
      req.user.id,
      req.user.email,
    );
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({ accessToken: tokens.accessToken });
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubAuth() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  githubAuthCallback(
    @Req() req: Request & { user: { id: string; email: string } },
    @Res() res: Response,
  ) {
    const tokens = this.authService.generateTokensForUser(
      req.user.id,
      req.user.email,
    );
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({ accessToken: tokens.accessToken });
  }
}
