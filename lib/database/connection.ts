import { env } from "@/lib/env";

const isVercel = process.env.VERCEL === "1";
const isProduction = process.env.NODE_ENV === "production";
const usePostgres = !!env.databaseUrl || isVercel || isProduction;

let sqliteDb: any = null;
let initPromise: Promise<any> | null = null;

export async function getSqlite(): Promise<any> {
  if (usePostgres) {
    throw new Error(
      "CRITICAL DATABASE ERROR: Attempted to initialize SQLite in a PostgreSQL environment."
    );
  }

  if (sqliteDb) {
    return sqliteDb;
  }

  if (!initPromise) {
    initPromise = (async () => {
      const Database = (await import("better-sqlite3")).default;
      const dbPath = process.env.SQLITE_DB_PATH || "tracker.db";
      const dbInstance = new Database(dbPath);

      const { runMigrations } = await import("./migrator");
      runMigrations(dbInstance);

      sqliteDb = dbInstance;
      return dbInstance;
    })();
  }

  return initPromise;
}