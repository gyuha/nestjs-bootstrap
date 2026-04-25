import { createHash, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";

export type RefreshTokenPair = {
  plainToken: string;
  tokenHash: string;
};

@Injectable()
export class RefreshTokenService {
  generateRefreshTokenPair(): RefreshTokenPair {
    const plainToken = randomBytes(48).toString("base64url");

    return {
      plainToken,
      tokenHash: this.hashRefreshToken(plainToken),
    };
  }

  hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
