import { randomUUID } from "node:crypto";
import { like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { DrizzleRefreshTokenRepository } from "../../src/modules/auth/infrastructure/refresh-token.drizzle-repository";
import { migrateTestDatabase } from "../setup/test-database";
import "../setup/test-env";
import { refreshTokens, schema, users } from "../../src/shared/infrastructure/database/schema";

const databaseUrl = process.env.DATABASE_URL;
const emailPrefix = `refresh-token-repository-${randomUUID()}`;
const tokenPrefix = `refresh-token-hash-${randomUUID()}`;

describe("DrizzleRefreshTokenRepository", () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: DrizzleRefreshTokenRepository;

  beforeAll(() => {
    if (!databaseUrl?.includes("nestjs_bootstrap_test")) {
      throw new Error("Refusing to run refresh token repository tests against a non-test database");
    }

    migrateTestDatabase();
    pool = new Pool({ connectionString: databaseUrl });
    db = drizzle(pool, { schema });
    repository = new DrizzleRefreshTokenRepository(db);
  });

  beforeEach(async () => {
    await db.delete(users).where(like(users.email, `${emailPrefix}%`));
  });

  afterAll(async () => {
    if (db) {
      await db.delete(users).where(like(users.email, `${emailPrefix}%`));
    }

    await pool?.end();
  });

  it("creates a refresh token hash and finds it while valid", async () => {
    const user = await createUser("create@example.com");
    const tokenHash = `${tokenPrefix}-create`;
    const expiresAt = new Date(Date.now() + 60_000);

    const created = await repository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
      userAgent: "Vitest",
      ipAddress: "127.0.0.1",
    });

    expect(created).toMatchObject({
      id: expect.any(String),
      userId: user.id,
      tokenHash,
      expiresAt,
      revokedAt: null,
      replacedByTokenId: null,
      userAgent: "Vitest",
      ipAddress: "127.0.0.1",
      createdAt: expect.any(Date),
    });

    await expect(repository.findValidByHash(tokenHash)).resolves.toEqual(created);
    await expect(repository.findValidByHash(`${tokenPrefix}-missing`)).resolves.toBeNull();
  });

  it("does not find revoked or expired refresh tokens as valid", async () => {
    const user = await createUser("validity@example.com");
    const revoked = await repository.create({
      userId: user.id,
      tokenHash: `${tokenPrefix}-revoked`,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const expired = await repository.create({
      userId: user.id,
      tokenHash: `${tokenPrefix}-expired`,
      expiresAt: new Date(Date.now() - 60_000),
    });

    await repository.revoke(revoked.id, null);

    await expect(repository.findValidByHash(revoked.tokenHash)).resolves.toBeNull();
    await expect(repository.findValidByHash(expired.tokenHash)).resolves.toBeNull();
  });

  it("marks a token revoked with a replacement token id", async () => {
    const user = await createUser("revoke@example.com");
    const oldToken = await repository.create({
      userId: user.id,
      tokenHash: `${tokenPrefix}-old`,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const newToken = await repository.create({
      userId: user.id,
      tokenHash: `${tokenPrefix}-new`,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const revoked = await repository.revoke(oldToken.id, newToken.id);

    expect(revoked.id).toBe(oldToken.id);
    expect(revoked.revokedAt).toEqual(expect.any(Date));
    expect(revoked.replacedByTokenId).toBe(newToken.id);
    await expect(repository.findValidByHash(oldToken.tokenHash)).resolves.toBeNull();
    await expect(repository.findValidByHash(newToken.tokenHash)).resolves.toEqual(newToken);
  });

  it("allows only one concurrent rotation for a refresh token hash", async () => {
    const user = await createUser("concurrent-rotate@example.com");
    const currentToken = await repository.create({
      userId: user.id,
      tokenHash: `${tokenPrefix}-concurrent-rotate-current`,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const rotations = await Promise.allSettled([
      repository.rotate(currentToken.tokenHash, {
        tokenHash: `${tokenPrefix}-concurrent-rotate-first-replacement`,
        expiresAt: new Date(Date.now() + 60_000),
      }),
      repository.rotate(currentToken.tokenHash, {
        tokenHash: `${tokenPrefix}-concurrent-rotate-second-replacement`,
        expiresAt: new Date(Date.now() + 60_000),
      }),
    ]);
    const fulfilled = rotations.filter((result) => result.status === "fulfilled");
    const rejected = rotations.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const successfulRotation = fulfilled[0].value;
    expect(successfulRotation.currentToken).toMatchObject({
      id: currentToken.id,
      revokedAt: expect.any(Date),
      replacedByTokenId: successfulRotation.replacementToken.id,
    });
    expect(successfulRotation.replacementToken.userId).toBe(user.id);

    await expect(repository.findValidByHash(currentToken.tokenHash)).resolves.toBeNull();

    const firstReplacement = await repository.findValidByHash(
      `${tokenPrefix}-concurrent-rotate-first-replacement`,
    );
    const secondReplacement = await repository.findValidByHash(
      `${tokenPrefix}-concurrent-rotate-second-replacement`,
    );
    expect([firstReplacement, secondReplacement].filter(Boolean)).toHaveLength(1);
  });

  it("rejects rotation for missing, expired, or revoked refresh token hashes", async () => {
    const user = await createUser("rejected-rotate@example.com");
    const expired = await repository.create({
      userId: user.id,
      tokenHash: `${tokenPrefix}-rotate-expired`,
      expiresAt: new Date(Date.now() - 60_000),
    });
    const revoked = await repository.create({
      userId: user.id,
      tokenHash: `${tokenPrefix}-rotate-revoked`,
      expiresAt: new Date(Date.now() + 60_000),
    });
    await repository.revoke(revoked.id, null);

    await expect(
      repository.rotate(`${tokenPrefix}-rotate-missing`, {
        tokenHash: `${tokenPrefix}-missing-replacement`,
        expiresAt: new Date(Date.now() + 60_000),
      }),
    ).rejects.toThrow("Refresh token cannot be rotated");
    await expect(
      repository.rotate(expired.tokenHash, {
        tokenHash: `${tokenPrefix}-expired-replacement`,
        expiresAt: new Date(Date.now() + 60_000),
      }),
    ).rejects.toThrow("Refresh token cannot be rotated");
    await expect(
      repository.rotate(revoked.tokenHash, {
        tokenHash: `${tokenPrefix}-revoked-replacement`,
        expiresAt: new Date(Date.now() + 60_000),
      }),
    ).rejects.toThrow("Refresh token cannot be rotated");
  });

  it("returns an already revoked token without overwriting revoke metadata", async () => {
    const user = await createUser("double-revoke@example.com");
    const oldToken = await repository.create({
      userId: user.id,
      tokenHash: `${tokenPrefix}-double-revoke-old`,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const firstReplacement = await repository.create({
      userId: user.id,
      tokenHash: `${tokenPrefix}-double-revoke-first-replacement`,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const secondReplacement = await repository.create({
      userId: user.id,
      tokenHash: `${tokenPrefix}-double-revoke-second-replacement`,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const firstRevoke = await repository.revoke(oldToken.id, firstReplacement.id);
    const secondRevoke = await repository.revoke(oldToken.id, secondReplacement.id);

    expect(secondRevoke).toEqual(firstRevoke);
    expect(secondRevoke.replacedByTokenId).toBe(firstReplacement.id);
  });

  it("revokes all currently unrevoked tokens for a user", async () => {
    const user = await createUser("revoke-all@example.com");
    const otherUser = await createUser("other@example.com");
    const first = await repository.create({
      userId: user.id,
      tokenHash: `${tokenPrefix}-revoke-all-first`,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const second = await repository.create({
      userId: user.id,
      tokenHash: `${tokenPrefix}-revoke-all-second`,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const alreadyRevoked = await repository.create({
      userId: user.id,
      tokenHash: `${tokenPrefix}-already-revoked`,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const other = await repository.create({
      userId: otherUser.id,
      tokenHash: `${tokenPrefix}-other`,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await repository.revoke(alreadyRevoked.id, null);

    await repository.revokeAllForUser(user.id);

    await expect(repository.findValidByHash(first.tokenHash)).resolves.toBeNull();
    await expect(repository.findValidByHash(second.tokenHash)).resolves.toBeNull();
    await expect(repository.findValidByHash(alreadyRevoked.tokenHash)).resolves.toBeNull();
    await expect(repository.findValidByHash(other.tokenHash)).resolves.toEqual(other);

    const rows = await db
      .select()
      .from(refreshTokens)
      .where(like(refreshTokens.tokenHash, `${tokenPrefix}-revoke-all%`));
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.revokedAt)).toBe(true);
  });

  async function createUser(emailSuffix: string) {
    const [user] = await db
      .insert(users)
      .values({
        email: `${emailPrefix}-${emailSuffix}`,
        displayName: "Refresh Token Test User",
      })
      .returning();

    return user;
  }
});
