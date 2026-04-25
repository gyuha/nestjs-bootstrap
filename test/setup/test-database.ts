import { execFileSync } from "node:child_process";

const defaultTestDatabaseUrl = "postgres://postgres:postgres@localhost:5432/nestjs_bootstrap_test";

export function migrateTestDatabase() {
  const databaseUrl = process.env.DATABASE_URL ?? defaultTestDatabaseUrl;

  if (!databaseUrl.includes("nestjs_bootstrap_test")) {
    throw new Error("Refusing to migrate a database that is not nestjs_bootstrap_test");
  }

  execFileSync("pnpm", ["db:migrate"], {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      NODE_ENV: "test",
    },
  });
}
