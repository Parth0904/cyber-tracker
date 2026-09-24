import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { config } from "../../config";

export function initDatabase(customPath?: string): Database.Database {
  const dbPath = customPath || config.dbPath;

  if (dbPath !== ":memory:") {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(dbPath);

  // WAL + synchronous=FULL for maximum durability as requested
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = FULL");
  db.pragma("foreign_keys = ON");

  // Create tables and indices
  db.exec(`
    CREATE TABLE IF NOT EXISTS work_sessions (
      id TEXT PRIMARY KEY,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      active_seconds INTEGER NOT NULL,
      status TEXT NOT NULL,
      calendar_date TEXT NOT NULL,
      last_checkpoint TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_date ON work_sessions(calendar_date);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON work_sessions(status);

    CREATE TABLE IF NOT EXISTS agent_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  return db;
}
