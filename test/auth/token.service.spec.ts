import { createHash } from "node:crypto";
import type { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { describe, expect, it } from "vitest";
import { RefreshTokenService } from "../../src/modules/auth/application/refresh-token.service";
import { TokenService } from "../../src/modules/auth/application/token.service";

const accessTokenSecret = "test-access-secret-that-is-at-least-32-characters";

describe("TokenService", () => {
  it("signs an access token with the configured auth secret and expiry", async () => {
    const tokenService = new TokenService(new JwtService(), createConfigService());

    const accessToken = await tokenService.createAccessToken({
      userId: "user-123",
      role: "ADMIN",
      sessionId: "session-456",
    });

    const payload = await new JwtService().verifyAsync(accessToken, {
      secret: accessTokenSecret,
    });
    expect(payload).toMatchObject({
      sub: "user-123",
      role: "ADMIN",
      sessionId: "session-456",
    });
    expect(payload.email).toBeUndefined();
  });
});

describe("RefreshTokenService", () => {
  it("generates a plain refresh token with a different SHA-256 lookup hash", () => {
    const tokenService = new RefreshTokenService();

    const pair = tokenService.generateRefreshTokenPair();

    expect(pair.plainToken).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(pair.plainToken.length).toBeGreaterThan(60);
    expect(pair.tokenHash).toBe(createSha256(pair.plainToken));
    expect(pair.tokenHash).not.toBe(pair.plainToken);
  });

  it("hashes the same refresh token deterministically for lookup", () => {
    const tokenService = new RefreshTokenService();
    const pair = tokenService.generateRefreshTokenPair();

    expect(tokenService.hashRefreshToken(pair.plainToken)).toBe(pair.tokenHash);
  });
});

function createConfigService(): ConfigService {
  return {
    getOrThrow: (key: string) => {
      const values: Record<string, string> = {
        "auth.accessTokenExpiresIn": "15m",
        "auth.accessTokenSecret": accessTokenSecret,
      };

      const value = values[key];

      if (!value) {
        throw new Error(`Missing config key: ${key}`);
      }

      return value;
    },
  } as ConfigService;
}

function createSha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
