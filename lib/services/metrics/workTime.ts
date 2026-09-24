/**
 * Canonical Work Time Service
 * 
 * Central authoritative source of truth for:
 * - work_hours (Actual productive computer-use time measured by the Windows agent)
 * 
 * Rules:
 * 1. Automatic Windows active work time is the SOLE authoritative source of productive work hours.
 * 2. Learning and Hunting hours are NEVER added to Work Time (no double counting).
 * 3. Work time is never inferred from manual entries.
 * 4. Calendar dates are interpreted strictly in Asia/Kolkata timezone.
 * 5. Dashboard, Performance, Daily Target, Analytics, and Weekly Review MUST consume
 *    their work time numbers exclusively from this service.
 */

import {
  getWorkTimeByDate,
  getWorkTimeBetweenDates,
  getAllWorkTimeDaily,
  getWorkTimeRecord,
  WorkTimeDailyRecord,
} from "@/lib/repositories/workTimeDaily";
import { APP_TIMEZONE, getTodayDateString } from "./dates";

/**
 * Returns canonical work seconds for a specific calendar date (YYYY-MM-DD in Asia/Kolkata).
 */
export async function getCanonicalWorkSeconds(dateStr: string): Promise<number> {
  return getWorkTimeByDate(dateStr);
}

/**
 * Returns canonical work hours for a specific calendar date (YYYY-MM-DD in Asia/Kolkata),
 * rounded to 2 decimal places.
 */
export async function getCanonicalWorkHours(dateStr: string): Promise<number> {
  const seconds = await getWorkTimeByDate(dateStr);
  return Math.round((seconds / 3600) * 100) / 100;
}

/**
 * Returns canonical work hours for today in Asia/Kolkata.
 */
export async function getCanonicalTodayWorkHours(timezone = APP_TIMEZONE): Promise<number> {
  const todayStr = getTodayDateString(timezone);
  return getCanonicalWorkHours(todayStr);
}

/**
 * Returns a mapping of dateStr -> work_hours for an inclusive calendar date range.
 */
export async function getCanonicalWorkHoursRange(
  startDateStr: string,
  endDateStr: string
): Promise<Record<string, number>> {
  const secondsMap = await getWorkTimeBetweenDates(startDateStr, endDateStr);
  const hoursMap: Record<string, number> = {};

  for (const [date, seconds] of Object.entries(secondsMap)) {
    hoursMap[date] = Math.round((seconds / 3600) * 100) / 100;
  }
  return hoursMap;
}

/**
 * Returns the cumulative sum of canonical work hours across an inclusive calendar date range.
 */
export async function getCanonicalWorkHoursTotal(
  startDateStr: string,
  endDateStr: string
): Promise<number> {
  const secondsMap = await getWorkTimeBetweenDates(startDateStr, endDateStr);
  let totalSeconds = 0;
  for (const seconds of Object.values(secondsMap)) {
    totalSeconds += seconds;
  }
  return Math.round((totalSeconds / 3600) * 100) / 100;
}

/**
 * Returns all recorded canonical work time records.
 */
export async function getAllCanonicalWorkTime(): Promise<WorkTimeDailyRecord[]> {
  return getAllWorkTimeDaily();
}

/**
 * Detailed status for a specific date.
 */
export async function getCanonicalWorkTimeStatus(dateStr: string): Promise<{
  date: string;
  activeSeconds: number;
  workHours: number;
  updatedAt?: string;
  source: string;
}> {
  const record = await getWorkTimeRecord(dateStr);
  const activeSeconds = record ? record.active_seconds : 0;
  return {
    date: dateStr,
    activeSeconds,
    workHours: Math.round((activeSeconds / 3600) * 100) / 100,
    updatedAt: record?.updated_at,
    source: record?.source || "none",
  };
}
