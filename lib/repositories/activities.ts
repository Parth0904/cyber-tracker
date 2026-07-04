import {
  many,
} from "@/lib/database";

import {
  ActivityRow,
} from "@/lib/types";

import {
  TimeRange,
} from "@/lib/types/analytics";

export function getTodayActivities(
  date: string
): ActivityRow[] {

  return many<ActivityRow>(
    `
      SELECT *
      FROM activities
      WHERE date = ?
    `,
    date
  );

}

export function getAllActivities(): ActivityRow[] {

  return many<ActivityRow>(
    `
      SELECT *
      FROM activities
      ORDER BY date ASC
    `
  );

}

export function getActivities(
  range: TimeRange
): ActivityRow[] {

  if (range === "all") {
    return getAllActivities();
  }

  const days = {
    week: 7,
    month: 30,
    year: 365,
  }[range];

  return many<ActivityRow>(
    `
      SELECT *
      FROM activities
      WHERE date >= date('now', ?)
      ORDER BY date ASC
    `,
    `-${days} days`
  );

}