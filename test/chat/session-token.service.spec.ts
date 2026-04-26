import { describe, expect, it } from "vitest";
import { SessionTokenService } from "../../src/modules/chat/application/session-token.service";

describe("SessionTokenService", () => {
  it("returns a plain anonymous token and stores only a hash", () => {
    const service = new SessionTokenService();
    const pair = service.generate();

    expect(pair.plainToken).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(pair.tokenHash).not.toBe(pair.plainToken);
    expect(service.hash(pair.plainToken)).toBe(pair.tokenHash);
  });
});
