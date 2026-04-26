import { randomUUID } from "node:crypto";
import { like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { User } from "../../src/modules/users/domain/user.entity";
import { DrizzleUserRepository } from "../../src/modules/users/infrastructure/users.drizzle-repository";
import { migrateTestDatabase } from "../setup/test-database";
import "../setup/test-env";
import { schema, users } from "../../src/shared/infrastructure/database/schema";

const databaseUrl = process.env.DATABASE_URL;
const emailPrefix = `users-repository-${randomUUID()}`;

describe("DrizzleUserRepository", () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: DrizzleUserRepository;

  beforeAll(() => {
    if (!databaseUrl?.includes("nestjs_bootstrap_test")) {
      throw new Error("Refusing to run users repository tests against a non-test database");
    }

    migrateTestDatabase();
    pool = new Pool({ connectionString: databaseUrl });
    db = drizzle(pool, { schema });
    repository = new DrizzleUserRepository(db);
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

  it("creates and finds users by id and email", async () => {
    const created = await repository.create({
      email: `${emailPrefix}-create@example.com`,
      displayName: "Create User",
      avatarUrl: null,
      bio: "Created in repository test",
      role: "ADMIN",
      status: "active",
    });

    expect(created.id).toBeTypeOf("string");
    expect(created.email).toBe(`${emailPrefix}-create@example.com`);
    expect(created.role).toBe("ADMIN");

    await expect(repository.findById(created.id)).resolves.toEqual(created);
    await expect(repository.findByEmail(created.email)).resolves.toEqual(created);
    await expect(repository.findByEmail(`${emailPrefix}-missing@example.com`)).resolves.toBeNull();
  });

  it("normalizes email addresses for create and lookup", async () => {
    const created = await repository.create({
      email: `${emailPrefix}-MixedCase@Example.COM`,
      displayName: "Mixed Email User",
    });

    expect(created.email).toBe(`${emailPrefix}-mixedcase@example.com`);
    await expect(repository.findByEmail(`${emailPrefix}-MIXEDCASE@example.com`)).resolves.toEqual(
      created,
    );
  });

  it("updates persisted users", async () => {
    const created = await repository.create({
      email: `${emailPrefix}-update@example.com`,
      displayName: "Before",
    });

    await new Promise((resolve) => setTimeout(resolve, 5));

    created.updateProfile({ displayName: "After", avatarUrl: "https://example.com/after.png" });
    created.changeRole("ADMIN");
    created.deactivate();

    const updated = await repository.update(created);

    expect(updated.createdAt).toEqual(created.createdAt);
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
    expect(updated.displayName).toBe("After");
    expect(updated.avatarUrl).toBe("https://example.com/after.png");
    expect(updated.role).toBe("ADMIN");
    expect(updated.status).toBe("inactive");

    const persisted = await repository.findById(created.id);
    expect(persisted?.displayName).toBe("After");
  });

  it("lists users with pagination and filters", async () => {
    const alpha = await repository.create({
      email: `${emailPrefix}-alpha@example.com`,
      displayName: "Alpha Person",
      role: "ADMIN",
      status: "active",
    });
    await repository.create({
      email: `${emailPrefix}-beta@example.com`,
      displayName: "Beta Person",
      role: "USER",
      status: "inactive",
    });
    const gamma = await repository.create({
      email: `${emailPrefix}-gamma@example.com`,
      displayName: "Gamma Search",
      role: "ADMIN",
      status: "active",
    });

    const result = await repository.list({
      page: 1,
      limit: 10,
      role: "ADMIN",
      status: "active",
      search: emailPrefix,
    });

    expect(result).toEqual({
      items: [expect.any(User), expect.any(User)],
      page: 1,
      limit: 10,
      total: 2,
    });
    expect(result.items.map((user) => user.id).sort()).toEqual([alpha.id, gamma.id].sort());
  });

  it("uses stable createdAt and id ordering for paginated lists", async () => {
    const baseTime = new Date("2026-01-01T00:00:00.000Z");
    const firstId = "00000000-0000-4000-8000-000000000001";
    const secondId = "00000000-0000-4000-8000-000000000002";
    const thirdId = "00000000-0000-4000-8000-000000000003";

    await db.insert(users).values([
      {
        id: thirdId,
        email: `${emailPrefix}-page-third@example.com`,
        displayName: "Page Third",
        createdAt: new Date(baseTime.getTime() + 2_000),
        updatedAt: new Date(baseTime.getTime() + 2_000),
      },
      {
        id: firstId,
        email: `${emailPrefix}-page-first@example.com`,
        displayName: "Page First",
        createdAt: baseTime,
        updatedAt: baseTime,
      },
      {
        id: secondId,
        email: `${emailPrefix}-page-second@example.com`,
        displayName: "Page Second",
        createdAt: new Date(baseTime.getTime() + 1_000),
        updatedAt: new Date(baseTime.getTime() + 1_000),
      },
    ]);

    const result = await repository.list({
      page: 2,
      limit: 1,
      search: `${emailPrefix}-page`,
    });

    expect(result.items.map((user) => user.id)).toEqual([secondId]);
    expect(result.total).toBe(3);
  });

  it("treats percent signs in search input as literal text", async () => {
    const literal = await repository.create({
      email: `${emailPrefix}-literal-percent@example.com`,
      displayName: `${emailPrefix} Budget 100%`,
    });
    await repository.create({
      email: `${emailPrefix}-wildcard-percent@example.com`,
      displayName: `${emailPrefix} Budget 100 percent`,
    });

    const result = await repository.list({
      page: 1,
      limit: 10,
      search: `${emailPrefix} Budget 100%`,
    });

    expect(result.items.map((user) => user.id)).toEqual([literal.id]);
    expect(result.total).toBe(1);
  });

  it("returns empty pages when no users match", async () => {
    const result = await repository.list({
      page: 2,
      limit: 5,
      search: `${emailPrefix}-none`,
    });

    expect(result.items).toEqual([]);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(5);
    expect(result.total).toBe(0);
  });
});
