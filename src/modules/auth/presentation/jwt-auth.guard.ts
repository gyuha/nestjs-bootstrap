import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { AuthenticatedRequest } from "./request-user";
import type { UserRole } from "../../users/domain/user.types";

type JwtAccessTokenPayload = {
  sub?: unknown;
  role?: unknown;
  sessionId?: unknown;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  @Inject(JwtService)
  private readonly jwtService!: JwtService;

  @Inject(ConfigService)
  private readonly config!: ConfigService;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.user) {
      return true;
    }

    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException("Authentication required");
    }

    const payload = await this.verifyToken(token);

    request.user = {
      id: payload.sub,
      role: payload.role,
      ...(payload.sessionId ? { sessionId: payload.sessionId } : {}),
    };

    return true;
  }

  private extractBearerToken(authorization: string | undefined): string | null {
    const [scheme, token, extra] = authorization?.split(" ") ?? [];

    if (scheme !== "Bearer" || !token || extra) {
      return null;
    }

    return token;
  }

  private async verifyToken(token: string): Promise<{
    sub: string;
    role: UserRole;
    sessionId?: string;
  }> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtAccessTokenPayload>(token, {
        secret: this.config.getOrThrow<string>("auth.accessTokenSecret"),
      });

      if (!this.isValidPayload(payload)) {
        throw new UnauthorizedException("Invalid access token");
      }

      return {
        sub: payload.sub,
        role: payload.role,
        ...(typeof payload.sessionId === "string" ? { sessionId: payload.sessionId } : {}),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException("Invalid access token");
    }
  }

  private isValidPayload(payload: JwtAccessTokenPayload): payload is {
    sub: string;
    role: UserRole;
    sessionId?: string;
  } {
    return (
      typeof payload.sub === "string" &&
      (payload.role === "USER" || payload.role === "ADMIN") &&
      (payload.sessionId === undefined || typeof payload.sessionId === "string")
    );
  }
}
