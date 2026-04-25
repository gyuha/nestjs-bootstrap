import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenServiceInterface } from '../../domain/services/token.service.interface';
import { TokenPair, JwtPayload } from '../../domain/value-objects/token.value-object';
import { EnvService } from '../../../../config/env.service';
import { createHash, randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class JwtTokenService implements TokenServiceInterface {
  constructor(
    private readonly jwt: JwtService,
    private readonly env: EnvService,
  ) {}

  generateAccessToken(userId: string, email: string, role: string): string {
    return this.jwt.sign(
      { sub: userId, email, role },
      { secret: this.env.get('JWT_SECRET'), expiresIn: this.env.get('JWT_EXPIRES_IN') },
    );
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwt.verify<JwtPayload>(token, { secret: this.env.get('JWT_SECRET') });
  }

  generateRefreshToken(): string {
    return uuidv4() + '-' + randomBytes(32).toString('hex');
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async generateTokenPair(userId: string, email: string, role: string): Promise<TokenPair> {
    const accessToken = this.generateAccessToken(userId, email, role);
    const refreshToken = this.generateRefreshToken();
    return { accessToken, refreshToken };
  }
}