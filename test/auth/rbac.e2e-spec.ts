import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { like } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestApp } from "../setup/test-app";
import { migrateTestDatabase } from "../setup/test-database";
import "../setup/test-env";
import { DATABASE } from "../../src/shared/infrastructure/database/database.tokens";
import { type schema, users } from "../../src/shared/infrastructure/database/schema";

const emailPrefix = `rbac-e2e-${randomUUID().slice(0, 8)}`;

describe("RBAC API", () => {
  let app: INestApplication;
  let db: NodePgDatabase<typeof schema>;

  beforeAll(async () => {
    migrateTestDatabase();
    app = await createTestApp();
    db = app.get(DATABASE);
  });

  beforeEach(async () => {
    await db.delete(users).where(like(users.email, `${emailPrefix}%`));
  });

  afterAll(async () => {
    await db?.delete(users).where(like(users.email, `${emailPrefix}%`));
    await app?.close();
  });

  it("allows a valid user token to access the protected self route", async () => {
    const user = await createUser(db, {
      email: `${emailPrefix}-self@example.com`,
      displayName: "Self User",
    });
    const token = await createAccessToken({ userId: user.id, role: "USER" });

    const response = await request(app.getHttpServer())
      .get("/api/v1/users/me")
      .set("authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.data).toMatchObject({
      id: user.id,
      email: user.email,
      displayName: "Self User",
      status: "active",
      role: "USER",
    });
  });

  it("rejects inactive users with otherwise valid tokens", async () => {
    const user = await createUser(db, {
      email: `${emailPrefix}-inactive@example.com`,
      displayName: "Inactive User",
      status: "inactive",
    });
    const token = await createAccessToken({ userId: user.id, role: "USER" });

    await request(app.getHttpServer())
      .get("/api/v1/users/me")
      .set("authorization", `Bearer ${token}`)
      .expect(401);
  });

  it("allows admin tokens to access the admin users route", async () => {
    const admin = await createUser(db, {
      email: `${emailPrefix}-admin@example.com`,
      displayName: "Admin User",
      role: "ADMIN",
    });
    const listed = await createUser(db, {
      email: `${emailPrefix}-listed@example.com`,
      displayName: "Listed User",
    });
    const token = await createAccessToken({ userId: admin.id, role: "ADMIN" });

    const response = await request(app.getHttpServer())
      .get("/api/v1/users")
      .query({ search: listed.email, page: 1, limit: 10 })
      .set("authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.data).toMatchObject({
      items: [
        expect.objectContaining({
          id: listed.id,
          email: listed.email,
        }),
      ],
      page: 1,
      limit: 10,
      total: 1,
    });
  });

  it("forbids USER tokens on the admin users route", async () => {
    const user = await createUser(db, {
      email: `${emailPrefix}-user@example.com`,
      displayName: "Regular User",
    });
    const token = await createAccessToken({ userId: user.id, role: "USER" });

    await request(app.getHttpServer())
      .get("/api/v1/users")
      .set("authorization", `Bearer ${token}`)
      .expect(403);
  });
});

async function createAccessToken(input: { userId: string; role: "USER" | "ADMIN" }) {
  return new JwtService().signAsync(
    {
      sub: input.userId,
      role: input.role,
      sessionId: randomUUID(),
    },
    {
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
    },
  );
}

async function createUser(
  db: NodePgDatabase<typeof schema>,
  input: {
    email: string;
    displayName: string;
    role?: "USER" | "ADMIN";
    status?: "active" | "inactive";
  },
) {
  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      displayName: input.displayName,
      role: input.role,
      status: input.status,
    })
    .returning();

  return user;
}
