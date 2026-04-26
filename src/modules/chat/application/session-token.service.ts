import { createHash, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";

const TOKEN_BYTES = 32;

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
}
