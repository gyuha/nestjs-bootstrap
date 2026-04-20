import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');
    const user = await this.usersService.create(dto);
    return this.generateTokens(user.id, user.email);
  }

  async login(_dto: LoginDto, user: { userId: string; email: string }) {
    return this.generateTokens(user.userId, user.email);
  }

  async refreshTokens(refreshToken: string) {
    // Task 4 will implement Redis validation
    // For now, just decode and issue new tokens
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
      return this.generateTokens(payload.sub, payload.email);
    } catch {
      throw new ConflictException('Invalid refresh token');
    }
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
      expiresIn: this.config.get<number>('JWT_REFRESH_TTL') ?? 604800,
      algorithm: 'HS512',
    });

    return { accessToken, refreshToken };
  }
}