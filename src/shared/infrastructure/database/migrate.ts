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

export async function runMigrations(databaseUrl: string, migrationsFolder = getMigrationsFolder()) {
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    await migrate(db, {
      migrationsFolder,
    });
  } finally {
    await pool.end();
  }
}

export async function runMigrationsFromEnv() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run migrations");
  }

  await runMigrations(databaseUrl);
}

if (require.main === module) {
  void runMigrationsFromEnv().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
