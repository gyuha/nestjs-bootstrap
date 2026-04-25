import "reflect-metadata";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function run() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run migrations");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    await migrate(db, {
      migrationsFolder: "src/shared/infrastructure/database/migrations",
    });
  } finally {
    await pool.end();
  }
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
