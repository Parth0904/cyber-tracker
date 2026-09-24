import type Database from "better-sqlite3";
import type { WorkSession, SessionStatus } from "../types";

export interface UnsyncedDailyTotal {
  calendar_date: string;
  total_seconds: number;
  max_updated_at: string;
}

export interface IAgentRepository {
  createSession(session: WorkSession): void;
  updateCheckpoint(id: string, endedAt: string, activeSeconds: number, lastCheckpoint: string): void;
  finalizeSession(id: string, endedAt: string, activeSeconds: number, status: SessionStatus): void;
  getActiveSessions(): WorkSession[];
  getSessionById(id: string): WorkSession | null;
  getTodayCumulativeSeconds(calendarDate: string): number;
  getUnsyncedDailyTotals(): UnsyncedDailyTotal[];
  markSessionsSynced(calendarDate: string, upToTimestamp: string, syncTime: string): void;
  setState(key: string, value: string): void;
  getState(key: string): string | null;
  close(): void;
}

export class SqliteAgentRepository implements IAgentRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public createSession(session: WorkSession): void {
    const stmt = this.db.prepare(`
      INSERT INTO work_sessions (
        id, started_at, ended_at, active_seconds, status, calendar_date, last_checkpoint, created_at, updated_at, synced_at
      ) VALUES (
        @id, @started_at, @ended_at, @active_seconds, @status, @calendar_date, @last_checkpoint, @created_at, @updated_at, @synced_at
      )
    `);
    stmt.run(session);
  }

  public updateCheckpoint(id: string, endedAt: string, activeSeconds: number, lastCheckpoint: string): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE work_sessions
      SET ended_at = ?, active_seconds = ?, last_checkpoint = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(endedAt, Math.max(0, Math.floor(activeSeconds)), lastCheckpoint, now, id);
  }

  public finalizeSession(id: string, endedAt: string, activeSeconds: number, status: SessionStatus): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE work_sessions
      SET ended_at = ?, active_seconds = ?, status = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(endedAt, Math.max(0, Math.floor(activeSeconds)), status, now, id);
  }

  public getActiveSessions(): WorkSession[] {
    const stmt = this.db.prepare(`
      SELECT * FROM work_sessions WHERE status = 'ACTIVE' ORDER BY started_at ASC
    `);
    return stmt.all() as WorkSession[];
  }

  public getSessionById(id: string): WorkSession | null {
    const stmt = this.db.prepare(`SELECT * FROM work_sessions WHERE id = ?`);
    const row = stmt.get(id);
    return (row as WorkSession) || null;
  }

  public getTodayCumulativeSeconds(calendarDate: string): number {
    const stmt = this.db.prepare(`
      SELECT COALESCE(SUM(active_seconds), 0) as total
      FROM work_sessions
      WHERE calendar_date = ?
    `);
    const result = stmt.get(calendarDate) as { total: number };
    return result?.total || 0;
  }

  public getUnsyncedDailyTotals(): UnsyncedDailyTotal[] {
    const stmt = this.db.prepare(`
      SELECT 
        s.calendar_date,
        (SELECT COALESCE(SUM(s2.active_seconds), 0) FROM work_sessions s2 WHERE s2.calendar_date = s.calendar_date) as total_seconds,
        MAX(s.updated_at) as max_updated_at
      FROM work_sessions s
      WHERE s.synced_at IS NULL OR s.status = 'ACTIVE' OR s.updated_at > s.synced_at
      GROUP BY s.calendar_date
      ORDER BY s.calendar_date ASC
    `);
    return stmt.all() as UnsyncedDailyTotal[];
  }

  public markSessionsSynced(calendarDate: string, upToTimestamp: string, syncTime: string): void {
    const stmt = this.db.prepare(`
      UPDATE work_sessions
      SET synced_at = ?
      WHERE calendar_date = ? AND updated_at <= ?
    `);
    stmt.run(syncTime, calendarDate, upToTimestamp);
  }

  public setState(key: string, value: string): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO agent_state (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);
    stmt.run(key, value, now);
  }

  public getState(key: string): string | null {
    const stmt = this.db.prepare(`SELECT value FROM agent_state WHERE key = ?`);
    const row = stmt.get(key) as { value: string } | undefined;
    return row?.value || null;
  }

  public close(): void {
    try {
      this.db.close();
    } catch {
      // Ignored if already closed
    }
  }
}
