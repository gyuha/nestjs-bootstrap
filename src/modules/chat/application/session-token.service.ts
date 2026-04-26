import { createHash, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";

const TOKEN_BYTES = 32;
const DURATION_PATTERN = /^(\d+)([smhd])$/;
const DURATION_MS_BY_UNIT = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

type DurationUnit = keyof typeof DURATION_MS_BY_UNIT;

export type AnonymousSessionTokenPair = {
  plainToken: string;
  tokenHash: string;
};

@Injectable()
export class SessionTokenService {
  generate(): AnonymousSessionTokenPair {
    const plainToken = randomBytes(TOKEN_BYTES).toString("base64url");

    return {
      plainToken,
      tokenHash: this.hash(plainToken),
    };
  }

  hash(plainToken: string): string {
    return createHash("sha256").update(plainToken).digest("hex");
  }

  calculateExpiresAt(duration: string, now = new Date()): Date {
    const match = DURATION_PATTERN.exec(duration);

    if (!match) {
      throw new Error(`Invalid duration: ${duration}`);
    }

    const amount = Number.parseInt(match[1], 10);
    const unit = match[2] as DurationUnit;

    return new Date(now.getTime() + amount * DURATION_MS_BY_UNIT[unit]);
  }

  isExpired(expiresAt: Date, now = new Date()): boolean {
    return expiresAt.getTime() <= now.getTime();
  }
}
