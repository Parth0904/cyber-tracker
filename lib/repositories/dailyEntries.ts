import db from "@/lib/db";
import { DailyEntry } from "@/lib/types";
import { TimeRange } from "@/lib/types/analytics";

export function getTodayEntry(
  date: string
): DailyEntry | undefined {
  return db
    .prepare(
      `
      SELECT *
      FROM daily_entries
      WHERE date = ?
    `
    )
    .get(date) as DailyEntry | undefined;
}

export function getAllDailyEntries(): DailyEntry[] {
  return db
    .prepare(
      `
      SELECT *
      FROM daily_entries
      ORDER BY date ASC
    `
    )
    .all() as DailyEntry[];
}

export function getEntries(
  range: TimeRange
): DailyEntry[] {
  if (range === "all") {
    return getAllDailyEntries();
  }

  const days = {
    week: 7,
    month: 30,
    year: 365,
  }[range];

  return db
    .prepare(
      `
      SELECT *
      FROM daily_entries
      WHERE date >= date('now', ?)
      ORDER BY date ASC
    `
    )
    .all(`-${days} days`) as DailyEntry[];
}

export function saveDailyEntry(
  entry: DailyEntry
) {
  return db
    .prepare(
      `
      INSERT INTO daily_entries (
        date,
        sleep_hours,
        bed_time,
        reading,
        focus_feeling,
        workout,
        steps,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date)
      DO UPDATE SET
        sleep_hours = excluded.sleep_hours,
        bed_time = excluded.bed_time,
        reading = excluded.reading,
        focus_feeling = excluded.focus_feeling,
        workout = excluded.workout,
        steps = excluded.steps,
        notes = excluded.notes
    `
    )
    .run(
      entry.date,
      entry.sleep_hours,
      entry.bed_time,
      entry.reading,
      entry.focus_feeling,
      entry.workout ? 1 : 0,
      entry.steps,
      entry.notes
    );
}