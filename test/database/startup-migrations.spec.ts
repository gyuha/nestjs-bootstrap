import type { ConfigService } from "@nestjs/config";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { runMigrations } from "../../src/shared/infrastructure/database/migrate";
import { runStartupMigrations } from "../../src/shared/infrastructure/database/startup-migrations";

vi.mock("../../src/shared/infrastructure/database/migrate", () => ({
  runMigrations: vi.fn(),
}));

function createConfig(values: Record<string, unknown>): ConfigService {
  return {
    get: vi.fn((key: string, defaultValue?: unknown) => values[key] ?? defaultValue),
    getOrThrow: vi.fn((key: string) => {
      const value = values[key];

      if (value === undefined) {
        throw new Error(`Missing config: ${key}`);
      }

      return value;
    }),
  } as unknown as ConfigService;
}

describe("startup migrations", () => {
  beforeEach(() => {
    vi.mocked(runMigrations).mockReset();
  });

  it("runs migrations when local startup migrations are enabled", async () => {
    vi.mocked(runMigrations).mockResolvedValue(undefined);

    const config = createConfig({
      "app.env": "local",
      "app.runMigrationsOnStartup": true,
      "database.url": "postgres://postgres:postgres@localhost:5432/nestjs_bootstrap",
    });

    await expect(runStartupMigrations(config)).resolves.toBe(true);
    expect(runMigrations).toHaveBeenCalledWith(
      "postgres://postgres:postgres@localhost:5432/nestjs_bootstrap",
    );
  });

  it("skips migrations when local startup migrations are disabled", async () => {
    const config = createConfig({
      "app.env": "local",
      "app.runMigrationsOnStartup": false,
      "database.url": "postgres://postgres:postgres@localhost:5432/nestjs_bootstrap",
    });

    await expect(runStartupMigrations(config)).resolves.toBe(false);
    expect(runMigrations).not.toHaveBeenCalled();
  });

  it("skips migrations in production even when the flag is enabled", async () => {
    const config = createConfig({
      "app.env": "production",
      "app.runMigrationsOnStartup": true,
      "database.url": "postgres://postgres:postgres@localhost:5432/nestjs_bootstrap",
    });

    await expect(runStartupMigrations(config)).resolves.toBe(false);
    expect(runMigrations).not.toHaveBeenCalled();
  });
});
