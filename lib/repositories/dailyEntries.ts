import { one, many, execute } from "@/lib/database";
import { DailyEntry } from "@/lib/types";
import { TimeRange } from "@/lib/types/analytics";
import { invalidateDiagnosticsCache } from "@/lib/services/cache";
import { APP_TIMEZONE, getRollingDateRange } from "@/lib/services/metrics/dates";

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

  const thresholdDateStr = getRollingDateRange(days, APP_TIMEZONE).startStr;

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
        reading = excluded.reading,
        focus_feeling = excluded.focus_feeling,
        workout = excluded.workout,
        steps = excluded.steps,
        notes = excluded.notes
    `,
    entry.date,
    entry.sleep_hours ?? null,
    entry.bed_time ?? null,
    entry.wake_time ?? null,
    entry.reading,
    entry.focus_feeling ?? null,
    entry.workout ? 1 : 0,
    entry.steps ?? 0,
    entry.notes ?? "",
    entry.mobile_screen_time ?? null
  );
  invalidateDiagnosticsCache();
}