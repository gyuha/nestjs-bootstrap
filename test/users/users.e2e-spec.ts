import { randomUUID } from "node:crypto";
import type { CanActivate, ExecutionContext, INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { like } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "../../src/app.module";
import { JwtAuthGuard } from "../../src/modules/auth/presentation/jwt-auth.guard";
import type { AuthenticatedUser } from "../../src/modules/auth/presentation/request-user";
import { applyBootstrap } from "../../src/bootstrap/apply-bootstrap";
import { DATABASE } from "../../src/shared/infrastructure/database/database.tokens";
import { type schema, users } from "../../src/shared/infrastructure/database/schema";
import { migrateTestDatabase } from "../setup/test-database";
import "../setup/test-env";

const emailPrefix = `users-e2e-${randomUUID()}`;

let currentAuthenticatedUser: AuthenticatedUser | null = null;

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();

    if (!currentAuthenticatedUser) {
      return false;
    }

    request.user = currentAuthenticatedUser;
    return true;
  }
}

describe("Users API", () => {
  let app: INestApplication;
  let db: NodePgDatabase<typeof schema>;

  beforeAll(async () => {
    migrateTestDatabase();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();
    applyBootstrap(app);
    await app.init();

    db = app.get(DATABASE);
  });

  beforeEach(async () => {
    currentAuthenticatedUser = null;
    await db.delete(users).where(like(users.email, `${emailPrefix}%`));
  });

  afterAll(async () => {
    await db?.delete(users).where(like(users.email, `${emailPrefix}%`));
    await app?.close();
  });

  it("returns the current user profile", async () => {
    const user = await createUser(db, {
      email: `${emailPrefix}-me@example.com`,
      displayName: "Current User",
      bio: "Profile text",
    });
    currentAuthenticatedUser = { id: user.id, role: "USER" };

    const response = await request(app.getHttpServer()).get("/api/v1/users/me").expect(200);

    expect(response.body.data).toMatchObject({
      id: user.id,
      email: user.email,
      displayName: "Current User",
      avatarUrl: null,
      bio: "Profile text",
      role: "USER",
      status: "active",
    });
    expect(response.body.meta.traceId).toBeTypeOf("string");
  });

  it("updates only editable current user profile fields", async () => {
    const user = await createUser(db, {
      email: `${emailPrefix}-self-update@example.com`,
      displayName: "Before",
    });
    currentAuthenticatedUser = { id: user.id, role: "USER" };

    const response = await request(app.getHttpServer())
      .patch("/api/v1/users/me")
      .send({
        displayName: "After",
        avatarUrl: "https://example.com/avatar.png",
        bio: null,
      })
      .expect(200);

    expect(response.body.data).toMatchObject({
      id: user.id,
      email: user.email,
      displayName: "After",
      avatarUrl: "https://example.com/avatar.png",
      bio: null,
      role: "USER",
      status: "active",
    });

    await request(app.getHttpServer())
      .patch("/api/v1/users/me")
      .send({ role: "ADMIN" })
      .expect(400);
  });

  it("allows admins to list users", async () => {
    const admin = await createUser(db, {
      email: `${emailPrefix}-admin@example.com`,
      displayName: "Admin",
      role: "ADMIN",
    });
    const listed = await createUser(db, {
      email: `${emailPrefix}-listed@example.com`,
      displayName: "Listed User",
      status: "inactive",
    });
    currentAuthenticatedUser = { id: admin.id, role: "ADMIN" };

    const response = await request(app.getHttpServer())
      .get("/api/v1/users")
      .query({ search: `${emailPrefix}-listed`, page: 1, limit: 10 })
      .expect(200);

    expect(response.body.data).toEqual({
      items: [
        expect.objectContaining({
          id: listed.id,
          email: listed.email,
          displayName: "Listed User",
          status: "inactive",
          role: "USER",
        }),
      ],
      page: 1,
      limit: 10,
      total: 1,
    });
  });

  it("normalizes admin-created user emails", async () => {
    const admin = await createUser(db, {
      email: `${emailPrefix}-create-admin@example.com`,
      displayName: "Create Admin",
      role: "ADMIN",
    });
    currentAuthenticatedUser = { id: admin.id, role: "ADMIN" };

    const response = await request(app.getHttpServer())
      .post("/api/v1/users")
      .send({
        email: `${emailPrefix}-Created@Example.COM`,
        displayName: "Created User",
      })
      .expect(201);

    expect(response.body.data).toMatchObject({
      email: `${emailPrefix}-created@example.com`,
      displayName: "Created User",
    });
  });

  it("allows admins to change user status", async () => {
    const admin = await createUser(db, {
      email: `${emailPrefix}-status-admin@example.com`,
      displayName: "Status Admin",
      role: "ADMIN",
    });
    const target = await createUser(db, {
      email: `${emailPrefix}-status-target@example.com`,
      displayName: "Status Target",
    });
    currentAuthenticatedUser = { id: admin.id, role: "ADMIN" };

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/users/${target.id}/status`)
      .send({ status: "inactive" })
      .expect(200);

    expect(response.body.data).toMatchObject({
      id: target.id,
      status: "inactive",
    });
  });

  it("rejects non-admin users from admin routes", async () => {
    const user = await createUser(db, {
      email: `${emailPrefix}-not-admin@example.com`,
      displayName: "Not Admin",
    });
    currentAuthenticatedUser = { id: user.id, role: "USER" };

    await request(app.getHttpServer()).get("/api/v1/users").expect(403);
  });
});

describe("Users API bearer authentication", () => {
  let app: INestApplication;
  let db: NodePgDatabase<typeof schema>;

  beforeAll(async () => {
    migrateTestDatabase();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    applyBootstrap(app);
    await app.init();

    db = app.get(DATABASE);
  });

  beforeEach(async () => {
    await db.delete(users).where(like(users.email, `${emailPrefix}%`));
  });

  afterAll(async () => {
    await db?.delete(users).where(like(users.email, `${emailPrefix}%`));
    await app?.close();
  });

  it("accepts a valid bearer JWT on protected users routes", async () => {
    const user = await createUser(db, {
      email: `${emailPrefix}-jwt-valid@example.com`,
      displayName: "JWT User",
    });
    const token = await createAccessToken({ userId: user.id, role: "USER" });

    const response = await request(app.getHttpServer())
      .get("/api/v1/users/me")
      .set("authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.data).toMatchObject({
      id: user.id,
      email: user.email,
      displayName: "JWT User",
    });
  });

  it("rejects missing and invalid bearer JWTs on protected users routes", async () => {
    await request(app.getHttpServer()).get("/api/v1/users/me").expect(401);

    await request(app.getHttpServer())
      .get("/api/v1/users/me")
      .set("authorization", "Bearer not-a-valid-token")
      .expect(401);
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
    avatarUrl?: string | null;
    bio?: string | null;
    role?: "USER" | "ADMIN";
    status?: "active" | "inactive";
  },
) {
  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      displayName: input.displayName,
      avatarUrl: input.avatarUrl,
      bio: input.bio,
      role: input.role,
      status: input.status,
    })
    .returning();

  return user;
}
