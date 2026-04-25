import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
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

  it("supports email-length provider user ids for password identities", () => {
    expect(authIdentities.providerUserId.getSQLType()).toBe("varchar(320)");
  });

  it("maintains updated timestamps through the shared timestamp helper", () => {
    expect(users.updatedAt.onUpdateFn).toBeTypeOf("function");
    expect(authIdentities.updatedAt.onUpdateFn).toBeTypeOf("function");
  });

  it("indexes refresh tokens by user id for bulk revocation", () => {
    const { indexes } = getTableConfig(refreshTokens);

    expect(indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          config: expect.objectContaining({
            name: "refresh_tokens_user_id_idx",
            columns: [expect.objectContaining({ name: "user_id" })],
          }),
        }),
      ]),
    );
  });
});
