import pg from "pg";

// Parse TIMESTAMP (OID 1114) as UTC ISO string to prevent timezone offset shifts
pg.types.setTypeParser(1114, (val) => {
  if (!val) return val;
  // If it doesn't have T and Z, convert space to T and append Z
  if (!val.includes("T")) {
    val = val.replace(" ", "T");
  }
  if (!val.includes("Z")) {
    val = val + "Z";
  }
  return val;
});

import { getSqlite } from "./connection";
import { env } from "@/lib/env";

const isVercel = process.env.VERCEL === "1";
const isProduction = process.env.NODE_ENV === "production";
const usePostgres = !!env.databaseUrl || isVercel || isProduction;

// connection pool for PostgreSQL (cached on globalThis to reuse connections across reloads)
const globalForPg = globalThis as unknown as { _pgPool?: pg.Pool };
let pgPool: pg.Pool | null = globalForPg._pgPool || null;

if (usePostgres) {
  if (!env.databaseUrl) {
    throw new Error(
      "CRITICAL DATABASE ERROR: PostgreSQL is required in this environment (Vercel or production), but DATABASE_URL is not defined."
    );
  }
  if (!pgPool) {
    pgPool = new pg.Pool({
      connectionString: env.databaseUrl,
      ssl: {
        rejectUnauthorized: false, // Required for secure serverless connections (Neon/Supabase)
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    globalForPg._pgPool = pgPool;
  }
}

// Translate SQLite parameterized syntax (?) to PostgreSQL ($1, $2, etc.)
function translateSql(sql: string): string {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

export type ExecutionResult = {
  lastInsertRowid: number;
  changes: number;
};

export async function one<T>(
  sql: string,
  ...params: unknown[]
): Promise<T | undefined> {
  if (pgPool) {
    const translated = translateSql(sql);
    const result = await pgPool.query(translated, params);
    return result.rows[0] as T | undefined;
  } else {
    // SQLite execution wrapper
    const sqliteDb = await getSqlite();
    const stmt = sqliteDb.prepare(sql);
    const row = stmt.get(...params);
    return row as T | undefined;
  }
}

export async function many<T>(
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  if (pgPool) {
    const translated = translateSql(sql);
    const result = await pgPool.query(translated, params);
    return result.rows as T[];
  } else {
    // SQLite execution wrapper
    const sqliteDb = await getSqlite();
    const stmt = sqliteDb.prepare(sql);
    const rows = stmt.all(...params);
    return rows as T[];
  }
}

export async function execute(
  sql: string,
  ...params: unknown[]
): Promise<ExecutionResult> {
  if (pgPool) {
    const translated = translateSql(sql);
    const result = await pgPool.query(translated, params);
    return {
      lastInsertRowid: 0,
      changes: result.rowCount || 0,
    };
  } else {
    // SQLite execution wrapper
    const sqliteDb = await getSqlite();
    const stmt = sqliteDb.prepare(sql);
    const result = stmt.run(...params);
    return {
      lastInsertRowid: Number(result.lastInsertRowid),
      changes: result.changes,
    };
  }
}

export async function insertReturningId(
  sql: string,
  ...params: unknown[]
): Promise<number> {
  if (pgPool) {
    const translated = translateSql(sql);
    let sqlToRun = translated;

    const cleanSql = sql.trim().toUpperCase();
    if (!cleanSql.includes("RETURNING")) {
      sqlToRun = `${translated} RETURNING id`;
    }

    const result = await pgPool.query(sqlToRun, params);
    const firstRow = result.rows[0];
    if (firstRow && firstRow.id !== undefined && firstRow.id !== null) {
      return Number(firstRow.id);
    }
    return 0;
  } else {
    // SQLite execution wrapper
    const sqliteDb = await getSqlite();
    const stmt = sqliteDb.prepare(sql);
    const result = stmt.run(...params);
    return Number(result.lastInsertRowid);
  }
}