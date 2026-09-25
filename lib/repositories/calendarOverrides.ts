import { one, many, execute } from "../database/query";
import { isWeekday } from "../services/metrics/workCalendar";

export interface CalendarOverrideRecord {
  date: string;
  status: "WORKDAY" | "HOLIDAY" | null;
  topic: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Retrieve calendar override for a specific date (YYYY-MM-DD).
 */
export async function getCalendarOverride(date: string): Promise<CalendarOverrideRecord | null> {
  const row = await one<CalendarOverrideRecord>(
    `SELECT date, status, topic, created_at, updated_at FROM calendar_overrides WHERE date = ?`,
    date
  );
  return row || null;
}

/**
 * Retrieve calendar overrides for an inclusive date range.
 * Returns a map of date -> CalendarOverrideRecord.
 */
export async function getCalendarOverridesBetween(
  startDate: string,
  endDate: string
): Promise<Record<string, CalendarOverrideRecord>> {
  const rows = await many<CalendarOverrideRecord>(
    `SELECT date, status, topic, created_at, updated_at FROM calendar_overrides WHERE date >= ? AND date <= ? ORDER BY date ASC`,
    startDate,
    endDate
  );

  const result: Record<string, CalendarOverrideRecord> = {};
  for (const row of rows) {
    result[row.date] = row;
  }
  return result;
}

/**
 * Upsert or remove a calendar override.
 *
 * Product Rule: Store ONLY overrides.
 * If status matches the default (weekday -> WORKDAY, weekend -> HOLIDAY)
 * AND topic is empty or null, the override row is deleted.
 *
 * If status is null but topic is provided, it stores status as null and the topic.
 */
export async function upsertCalendarOverride(
  date: string,
  status?: "WORKDAY" | "HOLIDAY" | null,
  topic?: string | null
): Promise<void> {
  const defaultStatus: "WORKDAY" | "HOLIDAY" = isWeekday(date) ? "WORKDAY" : "HOLIDAY";
  const cleanTopic = topic && topic.trim().length > 0 ? topic.trim() : null;
  const validStatus = status === "WORKDAY" || status === "HOLIDAY" ? status : null;

  // If status is either null or equal to default, and there is no topic, delete any existing override
  const isDefaultOrNull = validStatus === null || validStatus === defaultStatus;
  if (isDefaultOrNull && !cleanTopic) {
    await deleteCalendarOverride(date);
    return;
  }

  const sql = `
    INSERT INTO calendar_overrides (date, status, topic, created_at, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (date) DO UPDATE SET
      status = excluded.status,
      topic = excluded.topic,
      updated_at = CURRENT_TIMESTAMP
  `;

  await execute(sql, date, validStatus, cleanTopic);
}

/**
 * Delete override record for a date (reverting it completely to default).
 */
export async function deleteCalendarOverride(date: string): Promise<void> {
  await execute(`DELETE FROM calendar_overrides WHERE date = ?`, date);
}

/**
 * Retrieve all calendar overrides.
 */
export async function getAllCalendarOverrides(): Promise<CalendarOverrideRecord[]> {
  const rows = await many<CalendarOverrideRecord>(
    `SELECT date, status, topic, created_at, updated_at FROM calendar_overrides ORDER BY date ASC`
  );
  return rows;
}
