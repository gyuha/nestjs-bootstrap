import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { AuthenticatedRequest } from "../../auth/presentation/request-user";
import { USER_REPOSITORY, type UserRepository } from "../../users/domain/user.repository";
import type { UserRole } from "../../users/domain/user.types";

type JwtAccessTokenPayload = {
  sub?: unknown;
  role?: unknown;
  sessionId?: unknown;
};

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  @Inject(JwtService)
  private readonly jwtService!: JwtService;

  @Inject(ConfigService)
  private readonly config!: ConfigService;

  @Inject(USER_REPOSITORY)
  private readonly users!: UserRepository;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.user) {
      return true;
    }

    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) {
      return true;
    }

    const payload = await this.verifyToken(token);
    const user = await this.users.findById(payload.sub);

    if (!user || user.status !== "active") {
      throw new UnauthorizedException("Authentication required");
    }

    request.user = {
      id: user.id,
      role: user.role,
      ...(payload.sessionId ? { sessionId: payload.sessionId } : {}),
    };

    return true;
  }

  private extractBearerToken(authorization: string | undefined): string | null {
    const [scheme, token, extra] = authorization?.split(" ") ?? [];

    if (!authorization) {
      return null;
    }

    if (scheme !== "Bearer" || !token || extra) {
      throw new UnauthorizedException("Invalid access token");
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
