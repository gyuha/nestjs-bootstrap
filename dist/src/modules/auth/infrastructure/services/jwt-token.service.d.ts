import type { JwtService } from '@nestjs/jwt';
import type { TokenServiceInterface } from '../../domain/services/token.service.interface';
import type { TokenPair, JwtPayload } from '../../domain/value-objects/token.value-object';
import type { EnvService } from '../../../../config/env.service';
export declare class JwtTokenService implements TokenServiceInterface {
    private readonly jwt;
    private readonly env;
    constructor(jwt: JwtService, env: EnvService);
    generateAccessToken(userId: string, email: string, role: string): string;
    verifyAccessToken(token: string): JwtPayload;
    generateRefreshToken(): string;
    hashToken(token: string): string;
    generateTokenPair(userId: string, email: string, role: string): Promise<TokenPair>;
}
