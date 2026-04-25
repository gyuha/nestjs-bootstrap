import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppModule } from "../src/app.module";
import { applyBootstrap } from "../src/bootstrap/apply-bootstrap";
import { POSTGRES_POOL } from "../src/shared/infrastructure/database/database.tokens";
import { REDIS } from "../src/shared/infrastructure/redis/redis.tokens";

describe("GET /api/v1/health", () => {
  let app: INestApplication;

  afterEach(async () => {
    await app?.close();
  });

  it("returns dependency health without the standard response envelope", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(POSTGRES_POOL)
      .useValue({
        query: vi.fn().mockResolvedValue({ rows: [{ value: 1 }] }),
      })
      .overrideProvider(REDIS)
      .useValue({
        status: "ready",
        ping: vi.fn().mockResolvedValue("PONG"),
      })
      .compile();

    app = moduleRef.createNestApplication();
    applyBootstrap(app);
    await app.init();

    const response = await request(app.getHttpServer()).get("/api/v1/health").expect(200);

    expect(response.body.status).toBe("ok");
    expect(response.body.services.app.status).toBe("ok");
    expect(response.body.services.postgres.status).toMatch(/ok|down/);
    expect(response.body.services.redis.status).toMatch(/ok|down/);
    expect(response.body.data).toBeUndefined();
  });

  it("returns 503 when a dependency is down", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(POSTGRES_POOL)
      .useValue({
        query: vi.fn().mockRejectedValue(new Error("database unavailable")),
      })
      .overrideProvider(REDIS)
      .useValue({
        status: "ready",
        ping: vi.fn().mockResolvedValue("PONG"),
      })
      .compile();

    app = moduleRef.createNestApplication();
    applyBootstrap(app);
    await app.init();

    const response = await request(app.getHttpServer()).get("/api/v1/health").expect(503);

    expect(response.body.status).toBe("degraded");
    expect(response.body.services.app.status).toBe("ok");
    expect(response.body.services.postgres.status).toBe("down");
    expect(response.body.services.redis.status).toBe("ok");
    expect(response.body.data).toBeUndefined();
  });
});
