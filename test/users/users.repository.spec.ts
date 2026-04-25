import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
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

  it("updates persisted users", async () => {
    const created = await repository.create({
      email: `${emailPrefix}-update@example.com`,
      displayName: "Before",
    });

    created.updateProfile({ displayName: "After", avatarUrl: "https://example.com/after.png" });
    created.changeRole("ADMIN");
    created.deactivate();

    const updated = await repository.update(created);

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
