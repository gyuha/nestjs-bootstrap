import { Injectable } from "@nestjs/common";
import { JwtService, type JwtSignOptions } from "@nestjs/jwt";
import type { TokenServiceInterface } from "../../domain/services/token.service.interface";
import type { TokenPair, JwtPayload } from "../../domain/value-objects/token.value-object";
import { EnvService } from "../../../../config/env.service";
import { createHash, randomBytes } from "crypto";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class JwtTokenService implements TokenServiceInterface {
  constructor(
    private readonly jwt: JwtService,
    private readonly env: EnvService,
  ) {}

  generateAccessToken(userId: string, email: string, role: string): string {
    const options: JwtSignOptions = {
      secret: this.env.get("JWT_SECRET") as string,
      expiresIn: 900, // 15 minutes in seconds
    };
    return this.jwt.sign({ sub: userId, email, role }, options);
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwt.verify<JwtPayload>(token, { secret: this.env.get("JWT_SECRET") as string });
  }

  generateRefreshToken(): string {
    return uuidv4() + "-" + randomBytes(32).toString("hex");
  }

  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  async generateTokenPair(userId: string, email: string, role: string): Promise<TokenPair> {
    const accessToken = this.generateAccessToken(userId, email, role);
    const refreshToken = this.generateRefreshToken();
    return { accessToken, refreshToken };
  }
}
