import type { ConfigService } from "@nestjs/config";
import type { JwtService, JwtSignOptions } from "@nestjs/jwt";
import type { UserRole } from "../../users/domain/user.types";

export type AccessTokenInput = {
  userId: string;
  role: UserRole;
  sessionId: string;
};

export type AccessTokenPayload = {
  sub: string;
  role: UserRole;
  sessionId: string;
};

export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  createAccessToken(input: AccessTokenInput): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: input.userId,
      role: input.role,
      sessionId: input.sessionId,
    };

    return this.jwtService.signAsync(payload, {
      expiresIn: this.config.getOrThrow<string>(
        "auth.accessTokenExpiresIn",
      ) as JwtSignOptions["expiresIn"],
      secret: this.config.getOrThrow<string>("auth.accessTokenSecret"),
    });
  }
}
