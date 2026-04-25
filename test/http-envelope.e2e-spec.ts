import { Controller, Get, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { applyBootstrap } from "../src/bootstrap/apply-bootstrap";
import { AppConfigModule } from "../src/bootstrap/config/config.module";

@Controller({ path: "probe", version: "1" })
class ProbeController {
  @Get("ok")
  ok() {
    return { status: "ok" };
  }

  @Get("error")
  error() {
    throw new Error("probe failure");
  }
}

@Module({
  imports: [AppConfigModule],
  controllers: [ProbeController],
})
class ProbeModule {}

describe("HTTP envelope", () => {
  let app: Awaited<ReturnType<typeof createProbeApp>>;

  async function createProbeApp() {
    const moduleRef = await Test.createTestingModule({
      imports: [ProbeModule],
    }).compile();
    const nestApp = moduleRef.createNestApplication();
    applyBootstrap(nestApp);
    await nestApp.init();
    return nestApp;
  }

  afterEach(async () => {
    await app?.close();
  });

  it("wraps successful responses and returns a trace id", async () => {
    app = await createProbeApp();

    const response = await request(app.getHttpServer())
      .get("/api/v1/probe/ok")
      .set("x-request-id", "request-123")
      .expect(200);

    expect(response.headers["x-request-id"]).toBe("request-123");
    expect(response.body).toEqual({
      data: { status: "ok" },
      meta: { traceId: "request-123" },
    });
  });

  it("wraps errors with standard fields", async () => {
    app = await createProbeApp();

    const response = await request(app.getHttpServer())
      .get("/api/v1/probe/error")
      .set("x-request-id", "request-456")
      .expect(500);

    expect(response.body.traceId).toBe("request-456");
    expect(response.body.statusCode).toBe(500);
    expect(response.body.message).toBe("Internal server error");
    expect(response.body.errorCode).toBe("INTERNAL_SERVER_ERROR");
    expect(response.body.path).toBe("/api/v1/probe/error");
  });
});
