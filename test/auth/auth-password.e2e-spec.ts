import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { eq, like } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestApp } from "../setup/test-app";
import { migrateTestDatabase } from "../setup/test-database";
import "../setup/test-env";
import { DATABASE } from "../../src/shared/infrastructure/database/database.tokens";
import {
  authIdentities,
  refreshTokens,
  type schema,
  users,
} from "../../src/shared/infrastructure/database/schema";

const emailPrefix = `auth-e2e-${randomUUID().slice(0, 8)}`;
const password = "CorrectHorseBatteryStaple!1";

describe("Password auth API", () => {
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

  it("registers a user with an unverified password identity", async () => {
    const email = `${emailPrefix}-register@example.com`;

    const response = await register(email, "Registered User").expect(201);

    expect(response.body.data).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      user: {
        id: expect.any(String),
        email,
        displayName: "Registered User",
        role: "USER",
        status: "active",
      },
    });

    const [user] = await db.select().from(users).where(eq(users.email, email));
    expect(user).toMatchObject({
      email,
      displayName: "Registered User",
      status: "active",
      role: "USER",
    });

    const [identity] = await db
      .select()
      .from(authIdentities)
      .where(eq(authIdentities.userId, user.id));
    expect(identity).toMatchObject({
      userId: user.id,
      provider: "password",
      providerUserId: email,
      emailVerified: false,
    });
    expect(identity.passwordHash).toEqual(expect.stringContaining("$argon2id$"));
    expect(identity.passwordHash).not.toBe(password);
  });

  it("logs in with password credentials and returns tokens", async () => {
    const email = `${emailPrefix}-login@example.com`;
    await register(email, "Login User").expect(201);

    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(200);

    expect(response.body.data).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      user: {
        email,
        displayName: "Login User",
      },
    });
  });

  it("returns the same generic auth failure for wrong and unknown password credentials", async () => {
    const email = `${emailPrefix}-wrong-password@example.com`;
    await register(email, "Wrong Password User").expect(201);

    const wrongPassword = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email, password: "not-the-password" })
      .expect(401);

    const unknownUser = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: `${emailPrefix}-missing@example.com`, password: "not-the-password" })
      .expect(401);

    expect(wrongPassword.body.message).toBe("Invalid email or password");
    expect(unknownUser.body.message).toBe(wrongPassword.body.message);
  });

  it("rotates refresh tokens and rejects reuse of the revoked token", async () => {
    const email = `${emailPrefix}-refresh@example.com`;
    const registered = await register(email, "Refresh User").expect(201);
    const originalRefreshToken = registered.body.data.refreshToken;

    const refreshed = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: originalRefreshToken })
      .expect(200);

    expect(refreshed.body.data.accessToken).toEqual(expect.any(String));
    expect(refreshed.body.data.refreshToken).toEqual(expect.any(String));
    expect(refreshed.body.data.refreshToken).not.toBe(originalRefreshToken);

    await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: originalRefreshToken })
      .expect(401);

    const tokenRows = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, registered.body.data.user.id));
    expect(tokenRows).toHaveLength(2);
    expect(tokenRows.some((token) => token.revokedAt && token.replacedByTokenId)).toBe(true);
  });

  it("allows only one concurrent refresh with the same token", async () => {
    const email = `${emailPrefix}-concurrent-refresh@example.com`;
    const registered = await register(email, "Concurrent Refresh User").expect(201);
    const originalRefreshToken = registered.body.data.refreshToken;

    const refreshAttempts = await Promise.all([
      request(app.getHttpServer())
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: originalRefreshToken }),
      request(app.getHttpServer())
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: originalRefreshToken }),
    ]);
    const statuses = refreshAttempts.map((response) => response.status).sort();

    expect(statuses.filter((status) => status === 200)).toHaveLength(1);
    expect(statuses.filter((status) => status === 401)).toHaveLength(1);

    const tokenRows = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, registered.body.data.user.id));
    const validTokens = tokenRows.filter(
      (token) => token.revokedAt === null && token.expiresAt.getTime() > Date.now(),
    );

    expect(tokenRows).toHaveLength(2);
    expect(validTokens).toHaveLength(1);
    expect(tokenRows.filter((token) => token.revokedAt !== null)).toHaveLength(1);
  });

  it("revokes refresh tokens on logout", async () => {
    const email = `${emailPrefix}-logout@example.com`;
    const registered = await register(email, "Logout User").expect(201);
    const refreshToken = registered.body.data.refreshToken;

    await request(app.getHttpServer())
      .post("/api/v1/auth/logout")
      .send({ refreshToken })
      .expect(200);

    await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken })
      .expect(401);
  });

  it("returns the authenticated user for a valid access token", async () => {
    const email = `${emailPrefix}-me@example.com`;
    const registered = await register(email, "Me User").expect(201);

    const response = await request(app.getHttpServer())
      .get("/api/v1/auth/me")
      .set("authorization", `Bearer ${registered.body.data.accessToken}`)
      .expect(200);

    expect(response.body.data).toMatchObject({
      id: registered.body.data.user.id,
      email,
      displayName: "Me User",
      status: "active",
    });
  });

  it("rejects login and refresh for inactive users", async () => {
    const email = `${emailPrefix}-inactive@example.com`;
    const registered = await register(email, "Inactive User").expect(201);
    const refreshToken = registered.body.data.refreshToken;

    await db
      .update(users)
      .set({ status: "inactive" })
      .where(eq(users.id, registered.body.data.user.id));

    await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(401);

    await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken })
      .expect(401);
  });

  function register(email: string, displayName: string) {
    return request(app.getHttpServer()).post("/api/v1/auth/register").send({
      email,
      password,
      displayName,
    });
  }
});
