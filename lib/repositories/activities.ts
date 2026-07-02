import db from "@/lib/db";

import {
  ActivityRow,
} from "@/lib/types";

import {
  TimeRange,
} from "@/lib/types/analytics";

export function getTodayActivities(
  date: string
) {
  return db
    .prepare(
      `
      SELECT *
      FROM activities
      WHERE date = ?
    `
    )
    .all(date);
}

export function getAllActivities() {
  return db
    .prepare(
      `
      SELECT *
      FROM activities
      ORDER BY date ASC
    `
    )
    .all();
}

export function getActivities(
  range: TimeRange
): ActivityRow[] {

  if (range === "all") {
    return getAllActivities() as ActivityRow[];
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
      FROM activities
      WHERE date >= date('now', ?)
      ORDER BY date ASC
    `
    )
    .all(`-${days} days`) as ActivityRow[];
}