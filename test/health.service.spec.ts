import { describe, expect, it, vi } from "vitest";
import { HealthService } from "../src/modules/health/presentation/health.service";

function createHealthService({
  query,
  ping,
  status = "ready",
}: {
  query: () => Promise<unknown>;
  ping: () => Promise<unknown>;
  status?: string;
}) {
  const service = new HealthService();

  Object.assign(service, {
    pool: { query },
    redis: { status, ping, connect: vi.fn().mockResolvedValue(undefined) },
  });

  return service;
}

describe("HealthService", () => {
  it("marks postgres down when the check times out", async () => {
    vi.useFakeTimers();

    const service = createHealthService({
      query: vi.fn(() => new Promise(() => undefined)),
      ping: vi.fn().mockResolvedValue("PONG"),
    });

    const health = service.check();
    await vi.advanceTimersByTimeAsync(1_000);

    await expect(health).resolves.toMatchObject({
      status: "degraded",
      services: {
        postgres: { status: "down" },
        redis: { status: "ok" },
      },
    });

    vi.useRealTimers();
  });
});
