import { execFileSync } from "node:child_process";

export function migrateTestDatabase() {
  execFileSync("pnpm", ["db:migrate"], {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "test",
    },
  });
}
