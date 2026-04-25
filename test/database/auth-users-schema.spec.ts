import { describe, expect, it } from "vitest";
import {
  authIdentities,
  refreshTokens,
  users,
} from "../../src/shared/infrastructure/database/schema";

describe("auth/users schema", () => {
  it("exports required tables", () => {
    expect(users).toBeDefined();
    expect(authIdentities).toBeDefined();
    expect(refreshTokens).toBeDefined();
  });
});
