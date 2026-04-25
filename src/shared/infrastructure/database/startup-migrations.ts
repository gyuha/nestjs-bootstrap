import { Logger } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { runMigrations } from "./migrate";
import { type RuntimeEnv, shouldRunMigrationsOnStartup } from "./migration-policy";

const logger = new Logger("StartupMigrations");

export async function runStartupMigrations(config: ConfigService): Promise<boolean> {
  const env = config.getOrThrow<RuntimeEnv>("app.env");
  const runMigrationsOnStartup = config.get<boolean>("app.runMigrationsOnStartup", false);

  if (!shouldRunMigrationsOnStartup({ env, runMigrationsOnStartup })) {
    return false;
  }

  const databaseUrl = config.getOrThrow<string>("database.url");

  logger.log("Running startup database migrations");
  await runMigrations(databaseUrl);
  logger.log("Startup database migrations completed");

  return true;
}
