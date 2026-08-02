import { many, execute } from "@/lib/database";
import { ActivityRow } from "@/lib/types";
import { TimeRange } from "@/lib/types/analytics";

export async function getTodayActivities(
  date: string
): Promise<ActivityRow[]> {
  return await many<ActivityRow>(
    `
      SELECT *
      FROM activities
      WHERE date = ?
    `,
    date
  );
}

export async function getAllActivities(): Promise<ActivityRow[]> {
  return await many<ActivityRow>(
    `
      SELECT *
      FROM activities
      ORDER BY date ASC
    `
  );
}

export async function getActivities(
  range: TimeRange
): Promise<ActivityRow[]> {
  if (range === "all") {
    return await getAllActivities();
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

  return await many<ActivityRow>(
    `
      SELECT *
      FROM activities
      WHERE date >= ?
      ORDER BY date ASC
    `,
    thresholdDateStr
  );
}

export async function incrementActivity(
  date: string,
  type: string
): Promise<void> {
  await execute(
    `
      INSERT INTO activities (date, type)
      VALUES (?, ?)
    `,
    date,
    type
  );
}