import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "path";
import { ensureDatabaseReady } from "./index";

async function runMigrations() {
  console.log("🚀 Starting CineBook Database Migrations...");
  const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  if (dbUrl && dbUrl.startsWith("postgres")) {
    console.log("Connecting to PostgreSQL / Neon database...");
    const migrationClient = postgres(dbUrl, { max: 1 });
    const db = drizzle(migrationClient);

    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    });

    await migrationClient.end();
    console.log("✅ Migrations completed successfully on PostgreSQL/Neon!");
  } else {
    console.log("Applying migrations to local PGlite instance...");
    await ensureDatabaseReady();
    console.log("✅ Local PGlite database ready with full schema!");
  }
}

runMigrations().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
