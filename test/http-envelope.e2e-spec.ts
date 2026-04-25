import { Controller, Get, HttpException, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { applyBootstrap } from "../src/bootstrap/apply-bootstrap";
import { AppConfigModule } from "../src/bootstrap/config/config.module";
import { SkipResponseEnvelope } from "../src/shared/presentation/http/skip-response-envelope.decorator";

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

  @Get("http-error-string")
  httpErrorString() {
    throw new HttpException("quota exceeded", 429);
  }

  @Get("http-error-object")
  httpErrorObject() {
    throw new HttpException({ message: "invalid probe" }, 400);
  }

  @Get("raw")
  @SkipResponseEnvelope()
  raw() {
    return { status: "raw" };
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

  it("preserves string HttpException responses as the error message", async () => {
    app = await createProbeApp();

    const response = await request(app.getHttpServer())
      .get("/api/v1/probe/http-error-string")
      .set("x-request-id", "request-789")
      .expect(429);

    expect(response.body.traceId).toBe("request-789");
    expect(response.body.statusCode).toBe(429);
    expect(response.body.message).toBe("quota exceeded");
    expect(response.body.errorCode).toBe("TOO_MANY_REQUESTS");
    expect(response.body.path).toBe("/api/v1/probe/http-error-string");
  });

  it("preserves object HttpException message fields", async () => {
    app = await createProbeApp();

    const response = await request(app.getHttpServer())
      .get("/api/v1/probe/http-error-object")
      .set("x-request-id", "request-object")
      .expect(400);

    expect(response.body.traceId).toBe("request-object");
    expect(response.body.statusCode).toBe(400);
    expect(response.body.message).toBe("invalid probe");
    expect(response.body.errorCode).toBe("BAD_REQUEST");
    expect(response.body.path).toBe("/api/v1/probe/http-error-object");
  });

  it("skips response envelopes for decorated handlers", async () => {
    app = await createProbeApp();

    const response = await request(app.getHttpServer())
      .get("/api/v1/probe/raw")
      .set("x-request-id", "request-raw")
      .expect(200);

    expect(response.headers["x-request-id"]).toBe("request-raw");
    expect(response.body).toEqual({ status: "raw" });
  });
});
