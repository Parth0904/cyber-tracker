import { one, many, execute } from "../database/query";

export interface WorkTimeDailyRecord {
  date: string;
  active_seconds: number;
  updated_at?: string;
  source: string;
}

/**
 * Idempotently upsert verified daily work time from the Windows agent.
 * Uses standard SQL CASE logic supported across both SQLite and PostgreSQL
 * ensuring that cumulative active seconds are monotonic and never accidentally decreased.
 */
export async function upsertWorkTimeDaily(
  date: string,
  activeSeconds: number,
  source = "windows_agent"
): Promise<void> {
  const safeSeconds = Math.max(0, Math.floor(activeSeconds));
  const sql = `
    INSERT INTO work_time_daily (date, active_seconds, updated_at, source)
    VALUES (?, ?, CURRENT_TIMESTAMP, ?)
    ON CONFLICT (date) DO UPDATE SET
      active_seconds = CASE 
        WHEN excluded.active_seconds > work_time_daily.active_seconds THEN excluded.active_seconds 
        ELSE work_time_daily.active_seconds 
      END,
      updated_at = CURRENT_TIMESTAMP,
      source = excluded.source
  `;

  await execute(sql, date, safeSeconds, source);
}

/**
 * Retrieve verified active work seconds for a specific calendar date (Asia/Kolkata YYYY-MM-DD).
 */
export async function getWorkTimeByDate(date: string): Promise<number> {
  const row = await one<{ active_seconds: number }>(
    `SELECT active_seconds FROM work_time_daily WHERE date = ?`,
    date
  );
  return row ? Number(row.active_seconds) : 0;
}

/**
 * Retrieve detailed work time record for a specific calendar date.
 */
export async function getWorkTimeRecord(date: string): Promise<WorkTimeDailyRecord | null> {
  const row = await one<WorkTimeDailyRecord>(
    `SELECT date, active_seconds, updated_at, source FROM work_time_daily WHERE date = ?`,
    date
  );
  return row || null;
}

/**
 * Retrieve verified active work seconds for all calendar dates within an inclusive range.
 * Returns a mapping of dateStr -> active_seconds.
 */
export async function getWorkTimeBetweenDates(
  startDate: string,
  endDate: string
): Promise<Record<string, number>> {
  const rows = await many<{ date: string; active_seconds: number }>(
    `SELECT date, active_seconds FROM work_time_daily WHERE date >= ? AND date <= ? ORDER BY date ASC`,
    startDate,
    endDate
  );

  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.date] = Number(row.active_seconds);
  }
  return result;
}

/**
 * Retrieve all authoritative work time daily records.
 */
export async function getAllWorkTimeDaily(): Promise<WorkTimeDailyRecord[]> {
  const rows = await many<WorkTimeDailyRecord>(
    `SELECT date, active_seconds, updated_at, source FROM work_time_daily ORDER BY date ASC`
  );
  return rows;
}
