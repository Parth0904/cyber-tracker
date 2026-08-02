import pg from "pg";
import sqliteDb from "./connection";
import { env } from "@/lib/env";

// connection pool for PostgreSQL
let pgPool: pg.Pool | null = null;
if (env.databaseUrl) {
  pgPool = new pg.Pool({
    connectionString: env.databaseUrl,
    ssl: {
      rejectUnauthorized: false, // Required for secure serverless connections (Neon/Supabase)
    },
  });
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
    // SQLite synchronous execution wrapper
    return new Promise((resolve) => {
      const stmt = sqliteDb.prepare(sql);
      const row = stmt.get(...params);
      resolve(row as T | undefined);
    });
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
    // SQLite synchronous execution wrapper
    return new Promise((resolve) => {
      const stmt = sqliteDb.prepare(sql);
      const rows = stmt.all(...params);
      resolve(rows as T[]);
    });
  }
}

export async function execute(
  sql: string,
  ...params: unknown[]
): Promise<ExecutionResult> {
  if (pgPool) {
    const translated = translateSql(sql);
    let sqlToRun = translated;

    // Append RETURNING id clause to INSERT queries to get the inserted row id
    const cleanSql = sql.trim().toUpperCase();
    if (cleanSql.startsWith("INSERT") && !cleanSql.includes("RETURNING")) {
      sqlToRun = `${translated} RETURNING id`;
    }

    const result = await pgPool.query(sqlToRun, params);
    
    // Attempt to parse returning id
    const firstRow = result.rows[0];
    let insertedId = 0;
    if (firstRow) {
      insertedId = firstRow.id ? Number(firstRow.id) : 0;
    }

    return {
      lastInsertRowid: insertedId,
      changes: result.rowCount || 0,
    };
  } else {
    // SQLite synchronous execution wrapper
    return new Promise((resolve) => {
      const stmt = sqliteDb.prepare(sql);
      const result = stmt.run(...params);
      resolve({
        lastInsertRowid: Number(result.lastInsertRowid),
        changes: result.changes,
      });
    });
  }
}