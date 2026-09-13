import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

// Global singletons for development hot reload
declare global {
  // eslint-disable-next-line no-var
  var __cinebook_db: any;
  // eslint-disable-next-line no-var
  var __cinebook_pglite: PGlite | undefined;
}

let dbInstance: any;

function initDb() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && databaseUrl.startsWith("postgres")) {
    const client = postgres(databaseUrl, {
      max: process.env.NODE_ENV === "production" ? 10 : 5,
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: false, // Recommended for Neon serverless pooler
    });
    return drizzlePg(client, { schema });
  }

  // Fallback to local embedded PGlite for self-contained execution & QA tests
  if (!global.__cinebook_pglite) {
    // Persist data in project .pglite folder for local dev persistence
    const dataDir = path.join(process.cwd(), ".pgdata");
    global.__cinebook_pglite = new PGlite(dataDir);
  }

  const pgliteClient = global.__cinebook_pglite;
  return drizzlePglite(pgliteClient, { schema });
}

export function getDb() {
  if (!global.__cinebook_db) {
    global.__cinebook_db = initDb();
  }
  return global.__cinebook_db;
}

export const db = getDb();

export async function ensureDatabaseReady() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !databaseUrl.startsWith("postgres")) {
    // If using PGlite, ensure migration SQL is executed
    if (global.__cinebook_pglite) {
      try {
        const migrationPath = path.join(
          process.cwd(),
          "drizzle",
          "0000_solid_ben_grimm.sql"
        );
        if (fs.existsSync(migrationPath)) {
          const sqlContent = fs.readFileSync(migrationPath, "utf-8");
          const statements = sqlContent
            .split("--> statement-breakpoint")
            .map((s) => s.trim())
            .filter(Boolean);

          for (const stmt of statements) {
            try {
              await global.__cinebook_pglite.exec(stmt);
            } catch (e: any) {
              // Ignore already exists errors during hot-reload
              if (
                !e.message?.includes("already exists") &&
                !e.message?.includes("duplicate")
              ) {
                // Ignore harmless duplicate definition errors
              }
            }
          }
        }
      } catch (err) {
        console.error("PGlite schema initialization note:", err);
      }
    }
  }
}
