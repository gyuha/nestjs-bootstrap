import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { DrizzleAuthIdentityRepository } from "../../src/modules/auth/infrastructure/auth-identity.drizzle-repository";
import { migrateTestDatabase } from "../setup/test-database";
import "../setup/test-env";
import { schema, users } from "../../src/shared/infrastructure/database/schema";

const databaseUrl = process.env.DATABASE_URL;
const emailPrefix = `auth-identity-repository-${randomUUID()}`;

describe("DrizzleAuthIdentityRepository", () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: DrizzleAuthIdentityRepository;

  beforeAll(() => {
    if (!databaseUrl?.includes("nestjs_bootstrap_test")) {
      throw new Error("Refusing to run auth identity repository tests against a non-test database");
    }

    migrateTestDatabase();
    pool = new Pool({ connectionString: databaseUrl });
    db = drizzle(pool, { schema });
    repository = new DrizzleAuthIdentityRepository(db);
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

  it("creates and finds a password identity by email provider id", async () => {
    const user = await createUser("password@example.com");

    const created = await repository.create({
      userId: user.id,
      provider: "password",
      providerUserId: user.email,
      passwordHash: "argon2-password-hash",
      emailVerified: false,
    });

    expect(created).toMatchObject({
      id: expect.any(String),
      userId: user.id,
      provider: "password",
      providerUserId: user.email,
      passwordHash: "argon2-password-hash",
      emailVerified: false,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });

    await expect(repository.findByProvider("password", user.email)).resolves.toEqual(created);
    await expect(repository.findByUserAndProvider(user.id, "password")).resolves.toEqual(created);
    await expect(
      repository.findByProvider("password", `${emailPrefix}-missing@example.com`),
    ).resolves.toBeNull();
  });

  it("creates and finds a Google identity by sub", async () => {
    const user = await createUser("google@example.com");
    const googleSub = `google-sub-${randomUUID()}`;

    const created = await repository.create({
      userId: user.id,
      provider: "google",
      providerUserId: googleSub,
      passwordHash: null,
      emailVerified: true,
    });

    expect(created.provider).toBe("google");
    expect(created.providerUserId).toBe(googleSub);
    expect(created.passwordHash).toBeNull();
    expect(created.emailVerified).toBe(true);

    await expect(repository.findByProvider("google", googleSub)).resolves.toEqual(created);
    await expect(repository.findByUserAndProvider(user.id, "google")).resolves.toEqual(created);
  });

  async function createUser(emailSuffix: string) {
    const [user] = await db
      .insert(users)
      .values({
        email: `${emailPrefix}-${emailSuffix}`,
        displayName: "Auth Identity Test User",
      })
      .returning();

    return user;
  }
});
