import { randomUUID } from "node:crypto";
import type { ExecutionContext, INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { eq, like } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { migrateTestDatabase } from "../setup/test-database";
import "../setup/test-env";
import { AppModule } from "../../src/app.module";
import { applyBootstrap } from "../../src/bootstrap/apply-bootstrap";
import { GoogleAuthGuard } from "../../src/modules/auth/infrastructure/google-oauth.strategy";
import { DATABASE } from "../../src/shared/infrastructure/database/database.tokens";
import {
  authIdentities,
  type schema,
  users,
} from "../../src/shared/infrastructure/database/schema";

const emailPrefix = `google-oauth-e2e-${randomUUID().slice(0, 8)}`;

describe("Google OAuth API", () => {
  let app: INestApplication;
  let db: NodePgDatabase<typeof schema>;

  beforeAll(async () => {
    migrateTestDatabase();
    vi.spyOn(GoogleAuthGuard.prototype, "canActivate").mockImplementation(
      (context: ExecutionContext) => {
        const httpRequest = context.switchToHttp().getRequest();
        httpRequest.user = {
          providerUserId: httpRequest.query.sub ?? "google-sub-e2e",
          email: httpRequest.query.email ?? `${emailPrefix}-callback@example.com`,
          emailVerified: httpRequest.query.email_verified !== "false",
          displayName: httpRequest.query.name ?? "Google E2E User",
          avatarUrl: httpRequest.query.picture ?? null,
        };

        return true;
      },
    );
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
    vi.restoreAllMocks();
    await db?.delete(users).where(like(users.email, `${emailPrefix}%`));
    await app?.close();
  });

  it("returns tokens from the Google callback without calling Google", async () => {
    const email = `${emailPrefix}-callback@example.com`;

    const response = await request(app.getHttpServer())
      .get("/api/v1/auth/google/callback")
      .query({
        sub: "google-sub-callback",
        email,
        email_verified: "true",
        name: "Callback User",
        picture: "https://example.com/callback.png",
      })
      .expect(200);

    expect(response.body.data).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      user: {
        id: expect.any(String),
        email,
        displayName: "Callback User",
        avatarUrl: "https://example.com/callback.png",
        role: "USER",
        status: "active",
      },
    });

    const [identity] = await db
      .select()
      .from(authIdentities)
      .where(eq(authIdentities.providerUserId, "google-sub-callback"));
    expect(identity).toMatchObject({
      provider: "google",
      providerUserId: "google-sub-callback",
      emailVerified: true,
    });
  });

  it("initiates the Google OAuth route through the configured guard", async () => {
    await request(app.getHttpServer()).get("/api/v1/auth/google").expect(200);
  });
});
