import {
  one,
  many,
  execute,
} from "@/lib/database";

import { DailyEntry } from "@/lib/types";
import { TimeRange } from "@/lib/types/analytics";

export function getTodayEntry(
  date: string
): DailyEntry | undefined {

  return one<DailyEntry>(
    `
      SELECT *
      FROM daily_entries
      WHERE date = ?
    `,
    date
  );

}

export function getAllDailyEntries(): DailyEntry[] {

  return many<DailyEntry>(
    `
      SELECT *
      FROM daily_entries
      ORDER BY date ASC
    `
  );

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

  return many<DailyEntry>(
    `
      SELECT *
      FROM daily_entries
      WHERE date >= date('now', ?)
      ORDER BY date ASC
    `,
    `-${days} days`
  );

}

export function saveDailyEntry(
  entry: DailyEntry
) {

  return execute(
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
    `,
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