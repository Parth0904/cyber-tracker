import { one, many, execute } from "@/lib/database";
import { DailyEntry } from "@/lib/types";
import { TimeRange } from "@/lib/types/analytics";
import { invalidateConsistencyCache, invalidateDiagnosticsCache } from "@/lib/services/cache";

export async function getTodayEntry(
  date: string
): Promise<DailyEntry | undefined> {
  return await one<DailyEntry>(
    `
      SELECT *
      FROM daily_entries
      WHERE date = ?
    `,
    date
  );
}

export async function getAllDailyEntries(): Promise<DailyEntry[]> {
  return await many<DailyEntry>(
    `
      SELECT *
      FROM daily_entries
      ORDER BY date ASC
    `
  );
}

export async function getEntries(
  range: TimeRange
): Promise<DailyEntry[]> {
  if (range === "all") {
    return await getAllDailyEntries();
  }

  const days = {
    week: 7,
    month: 30,
    year: 365,
  }[range];

  // Calculate parameters in JS to ensure cross-database SQL syntax compatibility
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - days);
  const thresholdDateStr = thresholdDate.toISOString().split("T")[0];

  return await many<DailyEntry>(
    `
      SELECT *
      FROM daily_entries
      WHERE date >= ?
      ORDER BY date ASC
    `,
    thresholdDateStr
  );
}

export async function saveDailyEntry(
  entry: DailyEntry
) {
  return await execute(
    `
      INSERT INTO daily_entries (
        date,
        sleep_hours,
        bed_time,
        wake_time,
        reading,
        focus_feeling,
        workout,
        steps,
        notes,
        mobile_screen_time
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date)
      DO UPDATE SET
        sleep_hours = excluded.sleep_hours,
        bed_time = excluded.bed_time,
        wake_time = excluded.wake_time,
        reading = excluded.reading,
        focus_feeling = excluded.focus_feeling,
        workout = excluded.workout,
        steps = excluded.steps,
        notes = excluded.notes,
        mobile_screen_time = excluded.mobile_screen_time
    `,
    entry.date,
    entry.sleep_hours,
    entry.bed_time,
    entry.wake_time,
    entry.reading,
    entry.focus_feeling,
    entry.workout ? 1 : 0,
    entry.steps,
    entry.notes,
    entry.mobile_screen_time
  );
  invalidateConsistencyCache();
  invalidateDiagnosticsCache();
}