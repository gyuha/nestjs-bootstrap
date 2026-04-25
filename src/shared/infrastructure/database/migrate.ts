import "reflect-metadata";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const defaultMigrationFolders = [
  "migrations",
  "src/shared/infrastructure/database/migrations",
  "dist/shared/infrastructure/database/migrations",
];

function getMigrationsFolder() {
  if (process.env.MIGRATIONS_FOLDER) {
    return process.env.MIGRATIONS_FOLDER;
  }

  const migrationsFolder = defaultMigrationFolders.find((folder) => existsSync(resolve(folder)));

  if (!migrationsFolder) {
    throw new Error(
      `Migrations folder not found. Set MIGRATIONS_FOLDER or create one of: ${defaultMigrationFolders.join(", ")}`,
    );
  }

  return migrationsFolder;
}

async function run() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run migrations");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    await migrate(db, {
      migrationsFolder: getMigrationsFolder(),
    });
  } finally {
    await pool.end();
  }
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
