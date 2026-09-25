/**
 * Canonical Monthly Calendar Planner Service
 *
 * Implements the single, simple monthly planning model for Cyber Tracker.
 *
 * Core Principles:
 * 1. Schedule vs Work Time separation:
 *    - Calendar controls what is planned (WORKDAY vs HOLIDAY, optional topic).
 *    - Windows Work Time Agent controls what actually happened (work_time_daily).
 * 2. Default Calendar Rule:
 *    - Monday–Friday = WORKDAY (8h allocation)
 *    - Saturday–Sunday = HOLIDAY (0h allocation)
 *    - No public holidays, no external holiday APIs.
 * 3. Movable Days (Overrides):
 *    - User can change any individual date to WORKDAY or HOLIDAY.
 *    - Only deviations from default (or dates with topics) are persisted in calendar_overrides.
 *    - No "recovery day" concept. A Saturday changed to WORKDAY is simply a WORKDAY.
 * 4. Topic:
 *    - Optional note/topic for any date.
 *    - Purely calendar metadata; has zero impact on work time, required hours, or analytics.
 * 5. Monthly Calculations:
 *    - planned_workdays = count of effective WORKDAY dates in the month
 *    - monthly_required_hours = planned_workdays * 8
 *    - actual_work = aggregated active_seconds / 3600 from work_time_daily
 *    - remaining_hours = max(0, monthly_required_hours - actual_month_hours)
 *    - remaining_workdays = effective WORKDAY dates remaining in the month (inclusive of today)
 *    - required_daily_pace = remaining_hours / remaining_workdays (safely 0 if remaining_workdays = 0)
 * 6. Fresh Month:
 *    - Every month is completely independent.
 *    - September deficit never carries into October.
 */

import { APP_TIMEZONE, getTodayDateString } from "@/lib/services/metrics/dates";
import { isWeekday, getDayOfWeekName } from "@/lib/services/metrics/workCalendar";
import {
  CalendarOverrideRecord,
  getCalendarOverridesBetween,
  upsertCalendarOverride,
  deleteCalendarOverride,
} from "@/lib/repositories/calendarOverrides";
import { getWorkTimeBetweenDates } from "@/lib/repositories/workTimeDaily";

export type DayStatus = "WORKDAY" | "HOLIDAY";

export interface MonthlyCalendarDay {
  date: string; // YYYY-MM-DD
  dayOfMonth: number; // 1-31
  dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  isDefaultWorkday: boolean; // Monday-Friday default
  isOverridden: boolean;
  plannedStatus: DayStatus;
  plannedAllocationHours: number; // 8 for WORKDAY, 0 for HOLIDAY
  dailyTargetHours: number; // Distributed required target for remaining workdays (or 8h historical / 0h holiday)
  dailyTargetFormatted: string; // e.g. "Target: 6h", "Target: 8h", "Target: 0h", or "10+ hr needed"
  actualWorkSeconds: number;
  actualWorkHours: number;
  actualWorkFormatted: string; // e.g. "6h 42m"
  topic: string | null;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export interface MonthlyCalendarView {
  year: number;
  month: number; // 1-12
  monthName: string; // e.g. "September"
  startDate: string; // "YYYY-MM-01"
  endDate: string; // "YYYY-MM-DD"
  totalDays: number;
  plannedWorkdays: number;
  plannedHolidays: number;
  monthlyRequiredHours: number; // plannedWorkdays * 8
  actualWorkedSeconds: number;
  actualWorkedHours: number;
  actualWorkedFormatted: string; // e.g. "103h 24m"
  remainingHours: number;
  remainingHoursFormatted: string; // e.g. "72h 36m"
  surplusHours: number;
  remainingWorkdays: number;
  requiredDailyPace: number;
  requiredDailyPaceFormatted: string; // e.g. "8h 04m"
  daysWorkedCount: number;
  averageHoursPerPlannedWorkday: number;
  averageHoursPerPlannedWorkdayFormatted: string;
  highestWorkDay: {
    date: string;
    hours: number;
    formatted: string;
  } | null;
  days: MonthlyCalendarDay[];
}

export interface MonthlyCalendarReport {
  year: number;
  month: number;
  monthName: string;
  startDate: string;
  endDate: string;
  plannedWorkdays: number;
  plannedHolidays: number;
  requiredHours: number;
  actualWorkHours: number;
  actualWorkFormatted: string;
  averageHoursPerWorkday: number;
  averageHoursPerWorkdayFormatted: string;
  daysWorked: number;
  highestWorkDay: {
    date: string;
    hours: number;
    formatted: string;
  } | null;
  completionPercentage: number;
  surplusDeficitHours: number;
  isCompleted: boolean;
  requiredDailyPace: number;
  requiredDailyPaceFormatted: string;
}

const MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Format decimal hours to "Xh Ym" string (e.g. 6.7h -> "6h 42m").
 */
export function formatHoursMinutes(hoursDecimal: number): string {
  if (!hoursDecimal || hoursDecimal <= 0) return "0h 00m";
  const totalMinutes = Math.round(hoursDecimal * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

/**
 * Format required daily pace according to the 10-hour cap policy.
 * When calculated required daily pace reaches/exceeds 10 hours:
 * returns "10+ hr needed" instead of displaying values above 10h.
 */
export function formatRequiredPace(hoursDecimal: number): string {
  if (!hoursDecimal || hoursDecimal <= 0) return "0h 00m";
  if (hoursDecimal >= 10) {
    return "10+ hr needed";
  }
  return formatHoursMinutes(hoursDecimal);
}

/**
 * Format daily target according to the 10-hour cap policy.
 * When calculated target >= 10 hours:
 * returns "10+ hr needed" instead of displaying values >= 10h.
 * For integer hours: "Target: 6h", "Target: 8h", "Target: 0h"
 * For fractional hours: "Target: 8h 04m"
 */
export function formatDailyTarget(targetHours: number): string {
  if (!targetHours || targetHours <= 0) return "Target: 0h";
  if (targetHours >= 10) {
    return "10+ hr needed";
  }
  const rounded = Math.round(targetHours * 100) / 100;
  if (Number.isInteger(rounded)) {
    return `Target: ${rounded}h`;
  }
  const totalMinutes = Math.round(rounded * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (m === 0) return `Target: ${h}h`;
  return `Target: ${h}h ${String(m).padStart(2, "0")}m`;
}

/**
 * Format seconds to "Xh Ym" string (e.g. 24120s -> "6h 42m").
 */
export function formatSecondsToHoursMinutes(seconds: number): string {
  if (!seconds || seconds <= 0) return "0h 00m";
  const totalMinutes = Math.floor(seconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

/**
 * Derives the effective status of a date:
 * If an override with WORKDAY or HOLIDAY exists, use it.
 * Otherwise: weekday -> WORKDAY, weekend -> HOLIDAY.
 */
export function getEffectiveStatus(
  dateStr: string,
  overrideStatus?: "WORKDAY" | "HOLIDAY" | null,
  timezone = APP_TIMEZONE
): DayStatus {
  if (overrideStatus === "WORKDAY" || overrideStatus === "HOLIDAY") {
    return overrideStatus;
  }
  return isWeekday(dateStr, timezone) ? "WORKDAY" : "HOLIDAY";
}

/**
 * Pure compiler function: Computes the Monthly Calendar View from provided data.
 * Pure and deterministic for fast, comprehensive testing.
 */
export function calculateMonthCalendar(params: {
  year: number;
  month: number; // 1-12
  overrides?: Record<string, { status?: "WORKDAY" | "HOLIDAY" | null; topic?: string | null }>;
  workSecondsMap?: Record<string, number>;
  asOfDateStr?: string;
  timezone?: string;
}): MonthlyCalendarView {
  const { year, month } = params;
  const tz = params.timezone || APP_TIMEZONE;
  const asOf = params.asOfDateStr || getTodayDateString(tz);
  const overrides = params.overrides || {};
  const workSecondsMap = params.workSecondsMap || {};

  // Days in month calculation using UTC
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  const monthName = MONTH_NAMES[month] || `Month ${month}`;

  interface DayIntermediary {
    dateStr: string;
    day: number;
    dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
    isDefaultWorkday: boolean;
    isOverridden: boolean;
    effectiveStatus: DayStatus;
    plannedAllocationHours: number;
    dayWorkSec: number;
    actualHours: number;
    topic: string | null;
    isToday: boolean;
    isPast: boolean;
    isFuture: boolean;
  }

  const rawDays: DayIntermediary[] = [];
  let plannedWorkdays = 0;
  let plannedHolidays = 0;
  let actualWorkedSeconds = 0;
  let daysWorkedCount = 0;
  let highestSec = 0;
  let highestDate: string | null = null;
  let remainingWorkdays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayOfWeek = getDayOfWeekName(dateStr);
    const isDefaultWorkday = isWeekday(dateStr, tz);

    const override = overrides[dateStr];
    const hasStatusOverride =
      override?.status === "WORKDAY" || override?.status === "HOLIDAY";
    const effectiveStatus = getEffectiveStatus(dateStr, override?.status, tz);

    const isOverridden =
      hasStatusOverride &&
      ((isDefaultWorkday && effectiveStatus === "HOLIDAY") ||
        (!isDefaultWorkday && effectiveStatus === "WORKDAY"));

    const topic = override?.topic || null;
    const plannedAllocationHours = effectiveStatus === "WORKDAY" ? 8 : 0;

    if (effectiveStatus === "WORKDAY") {
      plannedWorkdays++;
    } else {
      plannedHolidays++;
    }

    const dayWorkSec = workSecondsMap[dateStr] || 0;
    actualWorkedSeconds += dayWorkSec;

    if (dayWorkSec > 0) {
      daysWorkedCount++;
      if (dayWorkSec > highestSec) {
        highestSec = dayWorkSec;
        highestDate = dateStr;
      }
    }

    const isToday = dateStr === asOf;
    const isPast = dateStr < asOf;
    const isFuture = dateStr > asOf;

    // Remaining workdays: in current month, dates >= asOf with WORKDAY status
    if (dateStr >= asOf && effectiveStatus === "WORKDAY") {
      remainingWorkdays++;
    }

    const actualHours = Math.round((dayWorkSec / 3600) * 100) / 100;

    rawDays.push({
      dateStr,
      day,
      dayOfWeek,
      isDefaultWorkday,
      isOverridden,
      effectiveStatus,
      plannedAllocationHours,
      dayWorkSec,
      actualHours,
      topic,
      isToday,
      isPast,
      isFuture,
    });
  }

  // Monthly required hours: planned_workdays * 8
  const monthlyRequiredHours = plannedWorkdays * 8;
  const actualWorkedHours = Math.round((actualWorkedSeconds / 3600) * 100) / 100;
  const remainingHours = Math.max(0, Math.round((monthlyRequiredHours - actualWorkedHours) * 100) / 100);
  const surplusHours = Math.max(0, Math.round((actualWorkedHours - monthlyRequiredHours) * 100) / 100);

  // If viewing a past month entirely before asOf, remainingWorkdays is 0
  if (endDate < asOf) {
    remainingWorkdays = 0;
  }
  // If viewing a future month entirely after asOf, remainingWorkdays is all planned workdays
  if (startDate > asOf) {
    remainingWorkdays = plannedWorkdays;
  }

  // Required Daily Pace:
  // remaining_hours / remaining_workdays
  // Safe zero handling (never NaN or Infinity)
  let requiredDailyPace = 0;
  if (remainingWorkdays > 0 && remainingHours > 0) {
    requiredDailyPace = Math.round((remainingHours / remainingWorkdays) * 100) / 100;
  }

  // Determine distributed daily target for remaining workdays
  const distributedDailyTarget =
    remainingWorkdays > 0 && remainingHours > 0 ? requiredDailyPace : 0;

  // Build final days array with per-cell target allocation
  const days: MonthlyCalendarDay[] = rawDays.map((d) => {
    let dailyTargetHours = 0;
    let dailyTargetFormatted = "Target: 0h";

    if (d.effectiveStatus === "HOLIDAY") {
      // Holidays always receive 0h target, excluded from deficit distribution
      dailyTargetHours = 0;
      dailyTargetFormatted = "Target: 0h";
    } else if (d.isPast) {
      // Historical completed days retain their standard 8h target
      dailyTargetHours = 8;
      dailyTargetFormatted = "Target: 8h";
    } else {
      // Remaining workdays (dateStr >= asOf in current/future month)
      if (startDate > asOf) {
        // Future month starts completely fresh: standard 8h target
        dailyTargetHours = 8;
        dailyTargetFormatted = "Target: 8h";
      } else {
        // Current month distributed deficit across remaining workdays
        dailyTargetHours = distributedDailyTarget;
        dailyTargetFormatted = formatDailyTarget(distributedDailyTarget);
      }
    }

    return {
      date: d.dateStr,
      dayOfMonth: d.day,
      dayOfWeek: d.dayOfWeek,
      isDefaultWorkday: d.isDefaultWorkday,
      isOverridden: d.isOverridden,
      plannedStatus: d.effectiveStatus,
      plannedAllocationHours: d.plannedAllocationHours,
      dailyTargetHours,
      dailyTargetFormatted,
      actualWorkSeconds: d.dayWorkSec,
      actualWorkHours: d.actualHours,
      actualWorkFormatted: formatSecondsToHoursMinutes(d.dayWorkSec),
      topic: d.topic,
      isToday: d.isToday,
      isPast: d.isPast,
      isFuture: d.isFuture,
    };
  });

  const averageHoursPerPlannedWorkday =
    plannedWorkdays > 0
      ? Math.round((actualWorkedHours / plannedWorkdays) * 100) / 100
      : 0;

  const highestWorkDay =
    highestSec > 0 && highestDate
      ? {
          date: highestDate,
          hours: Math.round((highestSec / 3600) * 100) / 100,
          formatted: formatSecondsToHoursMinutes(highestSec),
        }
      : null;

  return {
    year,
    month,
    monthName,
    startDate,
    endDate,
    totalDays: daysInMonth,
    plannedWorkdays,
    plannedHolidays,
    monthlyRequiredHours,
    actualWorkedSeconds,
    actualWorkedHours,
    actualWorkedFormatted: formatSecondsToHoursMinutes(actualWorkedSeconds),
    remainingHours,
    remainingHoursFormatted: formatHoursMinutes(remainingHours),
    surplusHours,
    remainingWorkdays,
    requiredDailyPace,
    requiredDailyPaceFormatted: formatRequiredPace(requiredDailyPace),
    daysWorkedCount,
    averageHoursPerPlannedWorkday,
    averageHoursPerPlannedWorkdayFormatted: formatHoursMinutes(averageHoursPerPlannedWorkday),
    highestWorkDay,
    days,
  };
}

/**
 * Fetches overrides and actual work time from the database and compiles the MonthlyCalendarView.
 */
export async function getMonthCalendar(
  year: number,
  month: number,
  asOfDateStr?: string,
  timezone = APP_TIMEZONE
): Promise<MonthlyCalendarView> {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  // Fetch overrides and work time in parallel
  const [overrides, workSecondsMap] = await Promise.all([
    getCalendarOverridesBetween(startDate, endDate),
    getWorkTimeBetweenDates(startDate, endDate),
  ]);

  return calculateMonthCalendar({
    year,
    month,
    overrides,
    workSecondsMap,
    asOfDateStr,
    timezone,
  });
}

/**
 * Saves a day's override status and/or topic.
 */
export async function saveDayOverride(
  date: string,
  status?: DayStatus | null,
  topic?: string | null
): Promise<void> {
  await upsertCalendarOverride(date, status, topic);
}

/**
 * Reverts a day's override completely to default.
 */
export async function revertDayOverride(date: string): Promise<void> {
  await deleteCalendarOverride(date);
}

/**
 * Generates the clean Monthly Report for a month.
 */
export async function generateMonthlyCalendarReport(
  year: number,
  month: number,
  asOfDateStr?: string,
  timezone = APP_TIMEZONE
): Promise<MonthlyCalendarReport> {
  const view = await getMonthCalendar(year, month, asOfDateStr, timezone);
  const completionPercentage =
    view.monthlyRequiredHours > 0
      ? Math.round((view.actualWorkedHours / view.monthlyRequiredHours) * 1000) / 10
      : (view.actualWorkedHours > 0 ? 100 : 0);

  const surplusDeficitHours =
    Math.round((view.actualWorkedHours - view.monthlyRequiredHours) * 100) / 100;

  const asOf = asOfDateStr || getTodayDateString(timezone);
  const isCompleted = view.endDate < asOf;

  return {
    year: view.year,
    month: view.month,
    monthName: view.monthName,
    startDate: view.startDate,
    endDate: view.endDate,
    plannedWorkdays: view.plannedWorkdays,
    plannedHolidays: view.plannedHolidays,
    requiredHours: view.monthlyRequiredHours,
    actualWorkHours: view.actualWorkedHours,
    actualWorkFormatted: view.actualWorkedFormatted,
    averageHoursPerWorkday: view.averageHoursPerPlannedWorkday,
    averageHoursPerWorkdayFormatted: view.averageHoursPerPlannedWorkdayFormatted,
    daysWorked: view.daysWorkedCount,
    highestWorkDay: view.highestWorkDay,
    completionPercentage,
    surplusDeficitHours,
    isCompleted,
    requiredDailyPace: view.requiredDailyPace,
    requiredDailyPaceFormatted: view.requiredDailyPaceFormatted,
  };
}
