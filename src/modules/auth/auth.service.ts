import { randomBytes } from 'crypto';
import { Inject, Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { REDIS_CLIENT } from '../../shared/infrastructure/redis/redis.provider';
import { EmailService } from '../../shared/infrastructure/email/email.service';
import type Redis from 'ioredis';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly refreshTokenTtl: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly emailService: EmailService,
  ) {
    this.refreshTokenTtl = this.config.get<number>('JWT_REFRESH_TTL') ?? 604800;
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');
    const user = await this.usersService.create(dto);

    const verifyToken = randomBytes(32).toString('hex');
    await this.redis.setex(`email:verify:${verifyToken}`, 86400, user.id);

    void this.emailService.sendSignupConfirmation(user.email, verifyToken);
    void this.emailService.sendWelcome(user.email);

    return this.generateTokens(user.id, user.email);
  }

  async login(_dto: LoginDto, user: { userId: string; email: string }, ip: string, userAgent: string) {
    void this.emailService.sendLoginAlert(user.email, ip, userAgent);
    return this.generateTokens(user.userId, user.email);
  }

  async logout(userId: string) {
    const pattern = `refresh:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;

    const token = randomBytes(32).toString('hex');
    await this.redis.setex(`email:password-reset:${token}`, 3600, user.id);
    void this.emailService.sendPasswordReset(user.email, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.redis.get(`email:password-reset:${token}`);
    if (!userId) throw new UnauthorizedException('Invalid or expired token');

    const passwordHash = await argon2.hash(newPassword);
    await this.usersService.updatePassword(userId, passwordHash);
    await this.redis.del(`email:password-reset:${token}`);
  }

  async verifyEmail(token: string): Promise<void> {
    const userId = await this.redis.get(`email:verify:${token}`);
    if (!userId) throw new UnauthorizedException('Invalid or expired token');

    await this.usersService.setEmailVerified(userId);
    await this.redis.del(`email:verify:${token}`);
  }

  async subscribeMarketing(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;

    const token = randomBytes(32).toString('hex');
    await this.redis.setex(`email:subscribe:${token}`, 172800, user.id);
    void this.emailService.sendSubscriptionConfirmation(user.email, token);
  }

  async confirmSubscription(token: string): Promise<void> {
    const userId = await this.redis.get(`email:subscribe:${token}`);
    if (!userId) throw new UnauthorizedException('Invalid or expired token');

    await this.usersService.setMarketingSubscribed(userId, true);
    await this.redis.del(`email:subscribe:${token}`);
  }

  async unsubscribeMarketing(token: string): Promise<void> {
    const userId = await this.redis.get(`email:unsubscribe:${token}`);
    if (!userId) throw new UnauthorizedException('Invalid or expired token');

    await this.usersService.setMarketingSubscribed(userId, false);
    await this.redis.del(`email:unsubscribe:${token}`);
  }

  async generateUnsubscribeToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await this.redis.setex(`email:unsubscribe:${token}`, 604800, userId);
    return token;
  }

  async refreshTokens(oldRefreshToken: string) {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify(oldRefreshToken, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedToken = await this.redis.get(`refresh:${payload.sub}:token`);
    if (storedToken !== oldRefreshToken) {
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    // Rotation: delete old, issue new
    await this.redis.del(`refresh:${payload.sub}:token`);
    const tokens = this.generateTokens(payload.sub, payload.email);
    await this.redis.setex(
      `refresh:${payload.sub}:token`,
      this.refreshTokenTtl,
      tokens.refreshToken,
    );
    return tokens;
  }

  generateTokensForUser(userId: string, email: string) {
    return this.generateTokens(userId, email);
  }

  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get<number>('JWT_ACCESS_TTL') ?? 1800,
      algorithm: 'HS512',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.refreshTokenTtl,
      algorithm: 'HS512',
    });

    return { accessToken, refreshToken };
  }
}
