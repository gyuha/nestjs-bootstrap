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

  it("calculates anonymous token expiry from supported duration strings", () => {
    const service = new SessionTokenService();
    const now = new Date("2026-01-01T00:00:00.000Z");

    expect(service.calculateExpiresAt("30s", now)).toEqual(new Date("2026-01-01T00:00:30.000Z"));
    expect(service.calculateExpiresAt("15m", now)).toEqual(new Date("2026-01-01T00:15:00.000Z"));
    expect(service.calculateExpiresAt("12h", now)).toEqual(new Date("2026-01-01T12:00:00.000Z"));
    expect(service.calculateExpiresAt("30d", now)).toEqual(new Date("2026-01-31T00:00:00.000Z"));
  });
});
