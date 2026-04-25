import { describe, expect, it } from "vitest";
import { Argon2PasswordHasher } from "../../src/modules/auth/infrastructure/argon2-password-hasher";

describe("Argon2PasswordHasher", () => {
  it("hashes a password with argon2id and verifies the correct password", async () => {
    const hasher = new Argon2PasswordHasher();

    const hash = await hasher.hash("correct horse battery staple");

    expect(hash).not.toBe("correct horse battery staple");
    expect(hash).toContain("$argon2id$");
    await expect(hasher.verify(hash, "correct horse battery staple")).resolves.toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hasher = new Argon2PasswordHasher();
    const hash = await hasher.hash("correct horse battery staple");

    await expect(hasher.verify(hash, "wrong password")).resolves.toBe(false);
  });
});
