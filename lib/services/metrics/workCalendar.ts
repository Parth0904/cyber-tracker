/**
 * Canonical Workweek Calendar Service
 * 
 * Central source of truth for the 5-day cybersecurity workweek model:
 * - Working Days: Monday to Friday (5 days)
 * - Default Holidays: Saturday and Sunday
 * - Daily Target: 8.0h / weekday
 * - Weekly Target: 40.0h (5 weekdays × 8.0h)
 * - Monthly Target: weekdayCount × 8.0h
 * - Asia/Kolkata timezone canonical source of truth
 */

import {
  APP_TIMEZONE,
  getTodayDateString,
  getCurrentMonthRange,
} from "./dates";

export type WeekendStatus = "NORMAL_HOLIDAY" | "RECOVERY_WORKDAY";

export interface WorkweekBoundaries {
  mondayStr: string;
  fridayStr: string;
  saturdayStr: string;
  sundayStr: string;
  startStr: string; // Monday (start of workweek)
  endStr: string;   // Friday (end of standard workweek)
  fullWeekEndStr: string; // Sunday (end of calendar week)
  weekdays: string[];     // [Mon, Tue, Wed, Thu, Fri]
  weekendDays: string[];  // [Sat, Sun]
  allDays: string[];      // [Mon, ..., Sun]
}

/**
 * Returns true if the given YYYY-MM-DD date is Monday through Friday in Asia/Kolkata.
 */
export function isWeekday(dateStr: string, _timezone = APP_TIMEZONE): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  const day = utc.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  return day >= 1 && day <= 5;
}

/**
 * Returns true if the given YYYY-MM-DD date is Saturday or Sunday in Asia/Kolkata.
 */
export function isWeekend(dateStr: string, _timezone = APP_TIMEZONE): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  const day = utc.getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Returns the day of week name for a YYYY-MM-DD date in UTC.
 */
export function getDayOfWeekName(dateStr: string): "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday" {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  const day = utc.getUTCDay();
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
  return names[day];
}

/**
 * Computes the Monday-to-Friday workweek and Saturday-to-Sunday weekend boundaries
 * for any date within the week in Asia/Kolkata.
 */
export function getWorkweekBoundaries(dateStr?: string, timezone = APP_TIMEZONE): WorkweekBoundaries {
  const baseStr = dateStr || getTodayDateString(timezone);
  const [y, m, d] = baseStr.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  const day = utc.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  
  // Calculate offset to Monday (Mon = 0 offset)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const mondayUtc = new Date(Date.UTC(y, m - 1, d + diffToMonday));

  const allDays: string[] = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(mondayUtc.getTime() + i * 24 * 60 * 60 * 1000);
    const cy = cur.getUTCFullYear();
    const cm = String(cur.getUTCMonth() + 1).padStart(2, "0");
    const cd = String(cur.getUTCDate()).padStart(2, "0");
    allDays.push(`${cy}-${cm}-${cd}`);
  }

  const mondayStr = allDays[0];
  const fridayStr = allDays[4];
  const saturdayStr = allDays[5];
  const sundayStr = allDays[6];

  return {
    mondayStr,
    fridayStr,
    saturdayStr,
    sundayStr,
    startStr: mondayStr,
    endStr: fridayStr,
    fullWeekEndStr: sundayStr,
    weekdays: allDays.slice(0, 5),
    weekendDays: allDays.slice(5, 7),
    allDays,
  };
}

/**
 * Counts the exact number of Monday–Friday weekdays in a given calendar month.
 */
export function getMonthWeekdayCount(year: number, month: number, _timezone = APP_TIMEZONE): number {
  // month is 1-indexed (1 to 12)
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  let count = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = d.getUTCDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      count++;
    }
  }
  return count;
}

/**
 * Counts the number of remaining Monday–Friday weekdays in the current workweek,
 * inclusive of today.
 * If today is Saturday or Sunday, returns 0 remaining weekdays.
 */
export function getRemainingWeekdaysInWorkweek(asOfDateStr: string, timezone = APP_TIMEZONE): number {
  const boundaries = getWorkweekBoundaries(asOfDateStr, timezone);
  if (asOfDateStr > boundaries.fridayStr) {
    return 0;
  }
  if (asOfDateStr < boundaries.mondayStr) {
    return 5;
  }
  return boundaries.weekdays.filter((d) => d >= asOfDateStr).length;
}

/**
 * Counts the number of remaining Monday–Friday weekdays in the current month,
 * inclusive of today.
 */
export function getRemainingMonthWeekdays(asOfDateStr: string, timezone = APP_TIMEZONE): number {
  const monthRange = getCurrentMonthRange(asOfDateStr, timezone);
  if (asOfDateStr > monthRange.endStr) {
    return 0;
  }
  const effectiveStart = asOfDateStr < monthRange.startStr ? monthRange.startStr : asOfDateStr;
  const [sy, sm, sd] = effectiveStart.split("-").map(Number);
  const [, , ed] = monthRange.endStr.split("-").map(Number);

  let count = 0;
  for (let day = sd; day <= ed; day++) {
    const cur = new Date(Date.UTC(sy, sm - 1, day));
    const dow = cur.getUTCDay();
    if (dow >= 1 && dow <= 5) {
      count++;
    }
  }
  return count;
}
