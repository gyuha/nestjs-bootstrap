import { describe, expect, it } from "vitest";
import { shouldRunMigrationsOnStartup } from "../../src/shared/infrastructure/database/migration-policy";

describe("migration policy", () => {
  it("allows startup migrations in local when enabled", () => {
    expect(
      shouldRunMigrationsOnStartup({
        env: "local",
        runMigrationsOnStartup: true,
      }),
    ).toBe(true);
  });

  it("allows startup migrations in test when enabled", () => {
    expect(
      shouldRunMigrationsOnStartup({
        env: "test",
        runMigrationsOnStartup: true,
      }),
    ).toBe(true);
  });

  it("blocks startup migrations in local when disabled", () => {
    expect(
      shouldRunMigrationsOnStartup({
        env: "local",
        runMigrationsOnStartup: false,
      }),
    ).toBe(false);
  });

  it("blocks startup migrations in test when disabled", () => {
    expect(
      shouldRunMigrationsOnStartup({
        env: "test",
        runMigrationsOnStartup: false,
      }),
    ).toBe(false);
  });

  it("blocks startup migrations in staging", () => {
    expect(
      shouldRunMigrationsOnStartup({
        env: "staging",
        runMigrationsOnStartup: true,
      }),
    ).toBe(false);
  });

  it("blocks startup migrations in production", () => {
    expect(
      shouldRunMigrationsOnStartup({
        env: "production",
        runMigrationsOnStartup: true,
      }),
    ).toBe(false);
  });
});
