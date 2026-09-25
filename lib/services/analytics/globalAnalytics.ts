/**
 * Canonical Global Analytics Engine
 *
 * Exclusively projects:
 *   work_time_daily (Authoritative Windows Agent actual work)
 *       +
 *   calendar_overrides (Monthly Calendar planned WORKDAY / HOLIDAY status)
 *       ↓
 *   Global Performance & Historical Trends
 *
 * Rules:
 * 1. Sole source of actual work is work_time_daily.active_seconds.
 * 2. Zero dependencies on targets, learning, hunting, sessions, recovery logic,
 *    or manual entries.
 * 3. Planned hours come exclusively from calendar effective WORKDAY dates (8h/workday).
 * 4. Actual work performed on holidays remains actual work (never erased or modified).
 * 5. Tracked calendar days = distinct dates present in the Work Time dataset.
 */

import { APP_TIMEZONE, getTodayDateString } from "@/lib/services/metrics/dates";
import { isWeekday } from "@/lib/services/metrics/workCalendar";
import { formatHoursMinutes, formatSecondsToHoursMinutes, getEffectiveStatus } from "@/lib/services/calendar/monthlyCalendar";
import { getAllWorkTimeDaily, WorkTimeDailyRecord } from "@/lib/repositories/workTimeDaily";
import { getAllCalendarOverrides, CalendarOverrideRecord } from "@/lib/repositories/calendarOverrides";

export interface MonthPerformanceSummary {
  month: string; // "YYYY-MM"
  monthName: string; // "September 2026"
  year: number;
  monthNum: number;
  plannedWorkdays: number;
  plannedHours: number; // plannedWorkdays * 8
  actualSeconds: number;
  actualHours: number;
  actualFormatted: string; // "137h 24m"
  completionPercentage: number;
  activeDays: number;
  averagePerActiveDayHours: number;
  averagePerActiveDayFormatted: string;
}

export interface GlobalAnalyticsResult {
  asOfDate: string;
  range: "all" | "this_year" | "prev_year" | string;
  rangeLabel: string;

  // Core Global Metrics
  totalActiveSeconds: number;
  totalWorkHours: number;
  totalWorkFormatted: string; // e.g. "842h 37m"

  trackedDaysCount: number; // distinct dates recorded in dataset
  activeDaysCount: number; // dates with active_seconds > 0
  plannedWorkdaysCount: number; // effective WORKDAY dates across tracked months
  totalPlannedHours: number; // plannedWorkdaysCount * 8

  averagePerTrackedDayHours: number;
  averagePerTrackedDayFormatted: string; // e.g. "5h 41m"

  averagePerWorkdayHours: number;
  averagePerWorkdayFormatted: string; // e.g. "7h 18m"

  planCompletionPercentage: number; // (totalWorkHours / totalPlannedHours) * 100

  highestDay: {
    date: string;
    formattedDate: string; // "Sep 18, 2026"
    seconds: number;
    hours: number;
    formattedDuration: string; // "9h 42m"
  } | null;

  lowestActiveDay: {
    date: string;
    formattedDate: string;
    seconds: number;
    hours: number;
    formattedDuration: string;
  } | null;

  currentStreakDays: number;

  // Monthly breakdown
  monthlyTrends: MonthPerformanceSummary[];
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

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Pure compiler: Calculates global performance metrics from raw records.
 */
export function calculateGlobalAnalytics(params: {
  records: WorkTimeDailyRecord[];
  overrides?: Record<string, "WORKDAY" | "HOLIDAY" | null>;
  range?: "all" | "this_year" | "prev_year" | string;
  asOfDateStr?: string;
  timezone?: string;
}): GlobalAnalyticsResult {
  const tz = params.timezone || APP_TIMEZONE;
  const asOfDate = params.asOfDateStr || getTodayDateString(tz);
  const range = params.range || "all";
  const overrides = params.overrides || {};

  const [asOfYear] = asOfDate.split("-").map(Number);
  const currentYear = asOfYear;

  let rangeLabel = "All Time";
  let filteredRecords = [...params.records];

  if (range === "this_year") {
    rangeLabel = `${currentYear} (This Year)`;
    filteredRecords = filteredRecords.filter((r) => r.date.startsWith(`${currentYear}-`));
  } else if (range === "prev_year") {
    const prevYear = currentYear - 1;
    rangeLabel = `${prevYear} (Previous Year)`;
    filteredRecords = filteredRecords.filter((r) => r.date.startsWith(`${prevYear}-`));
  } else if (/^\d{4}$/.test(range)) {
    rangeLabel = `${range}`;
    filteredRecords = filteredRecords.filter((r) => r.date.startsWith(`${range}-`));
  }

  // Sort chronologically
  filteredRecords.sort((a, b) => a.date.localeCompare(b.date));

  // Map of date -> active_seconds for fast lookup
  const workMap = new Map<string, number>();
  let totalActiveSeconds = 0;
  let activeDaysCount = 0;

  let highestSec = 0;
  let highestDate: string | null = null;

  let lowestSec = Number.MAX_SAFE_INTEGER;
  let lowestDate: string | null = null;

  for (const r of filteredRecords) {
    const sec = Math.max(0, Math.floor(r.active_seconds || 0));
    workMap.set(r.date, sec);
    totalActiveSeconds += sec;

    if (sec > 0) {
      activeDaysCount++;
      if (sec > highestSec) {
        highestSec = sec;
        highestDate = r.date;
      }
      if (sec < lowestSec) {
        lowestSec = sec;
        lowestDate = r.date;
      }
    }
  }

  const trackedDaysCount = filteredRecords.length;
  const totalWorkHours = Math.round((totalActiveSeconds / 3600) * 100) / 100;
  const totalWorkFormatted = formatSecondsToHoursMinutes(totalActiveSeconds);

  // Average work per tracked day
  const averagePerTrackedDayHours =
    trackedDaysCount > 0 ? Math.round((totalWorkHours / trackedDaysCount) * 100) / 100 : 0;
  const averagePerTrackedDayFormatted = formatHoursMinutes(averagePerTrackedDayHours);

  // Identify months represented in the dataset
  const monthKeysSet = new Set<string>();
  for (const r of filteredRecords) {
    monthKeysSet.add(r.date.slice(0, 7)); // "YYYY-MM"
  }

  const sortedMonthKeys = Array.from(monthKeysSet).sort();
  const monthlyTrends: MonthPerformanceSummary[] = [];

  let plannedWorkdaysCount = 0;

  for (const mKey of sortedMonthKeys) {
    const [y, m] = mKey.split("-").map(Number);
    const daysInMonth = getDaysInMonth(y, m);
    const monthName = `${MONTH_NAMES[m]} ${y}`;

    let monthWorkdays = 0;
    let monthActualSec = 0;
    let monthActiveDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const status = getEffectiveStatus(dateStr, overrides[dateStr], tz);
      if (status === "WORKDAY") {
        monthWorkdays++;
      }

      const sec = workMap.get(dateStr) || 0;
      if (sec > 0) {
        monthActualSec += sec;
        monthActiveDays++;
      }
    }

    plannedWorkdaysCount += monthWorkdays;
    const plannedHours = monthWorkdays * 8;
    const actualHours = Math.round((monthActualSec / 3600) * 100) / 100;
    const completionPercentage =
      plannedHours > 0 ? Math.round((actualHours / plannedHours) * 1000) / 10 : (actualHours > 0 ? 100 : 0);

    const avgPerActiveDay =
      monthActiveDays > 0 ? Math.round((actualHours / monthActiveDays) * 100) / 100 : 0;

    monthlyTrends.push({
      month: mKey,
      monthName,
      year: y,
      monthNum: m,
      plannedWorkdays: monthWorkdays,
      plannedHours,
      actualSeconds: monthActualSec,
      actualHours,
      actualFormatted: formatSecondsToHoursMinutes(monthActualSec),
      completionPercentage,
      activeDays: monthActiveDays,
      averagePerActiveDayHours: avgPerActiveDay,
      averagePerActiveDayFormatted: formatHoursMinutes(avgPerActiveDay),
    });
  }

  const totalPlannedHours = plannedWorkdaysCount * 8;

  // Average per planned workday
  const averagePerWorkdayHours =
    plannedWorkdaysCount > 0 ? Math.round((totalWorkHours / plannedWorkdaysCount) * 100) / 100 : 0;
  const averagePerWorkdayFormatted = formatHoursMinutes(averagePerWorkdayHours);

  // Plan completion percentage
  const planCompletionPercentage =
    totalPlannedHours > 0 ? Math.round((totalWorkHours / totalPlannedHours) * 1000) / 10 : (totalWorkHours > 0 ? 100 : 0);

  // Highest day
  const highestDay =
    highestSec > 0 && highestDate
      ? {
          date: highestDate,
          formattedDate: formatDateDisplay(highestDate),
          seconds: highestSec,
          hours: Math.round((highestSec / 3600) * 100) / 100,
          formattedDuration: formatSecondsToHoursMinutes(highestSec),
        }
      : null;

  // Lowest active day (lowest non-zero)
  const lowestActiveDay =
    lowestSec < Number.MAX_SAFE_INTEGER && lowestDate
      ? {
          date: lowestDate,
          formattedDate: formatDateDisplay(lowestDate),
          seconds: lowestSec,
          hours: Math.round((lowestSec / 3600) * 100) / 100,
          formattedDuration: formatSecondsToHoursMinutes(lowestSec),
        }
      : null;

  // Consecutive tracking streak (counting active days ending today or yesterday)
  let currentStreakDays = 0;
  if (params.records.length > 0) {
    // Build all-records lookup to compute streak regardless of range filter
    const allRecordsMap = new Map<string, number>();
    for (const r of params.records) {
      allRecordsMap.set(r.date, r.active_seconds || 0);
    }

    const checkDate = new Date(`${asOfDate}T00:00:00Z`);
    const todaySec = allRecordsMap.get(asOfDate) || 0;

    let cursor = new Date(checkDate.getTime());
    // If today has no work yet, check if streak from yesterday is active
    if (todaySec <= 0) {
      cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
    }

    while (true) {
      const cStr = cursor.toISOString().slice(0, 10);
      const s = allRecordsMap.get(cStr) || 0;
      if (s > 0) {
        currentStreakDays++;
        cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }
  }

  // Reverse chronological for tabular display
  monthlyTrends.sort((a, b) => b.month.localeCompare(a.month));

  return {
    asOfDate,
    range,
    rangeLabel,
    totalActiveSeconds,
    totalWorkHours,
    totalWorkFormatted,
    trackedDaysCount,
    activeDaysCount,
    plannedWorkdaysCount,
    totalPlannedHours,
    averagePerTrackedDayHours,
    averagePerTrackedDayFormatted,
    averagePerWorkdayHours,
    averagePerWorkdayFormatted,
    planCompletionPercentage,
    highestDay,
    lowestActiveDay,
    currentStreakDays,
    monthlyTrends,
  };
}

/**
 * Loads real Work Time and Calendar Overrides from DB and compiles Global Analytics.
 */
export async function getGlobalAnalytics(
  range: "all" | "this_year" | "prev_year" | string = "all",
  timezone = APP_TIMEZONE
): Promise<GlobalAnalyticsResult> {
  const asOfDateStr = getTodayDateString(timezone);

  const [records, overrideRows] = await Promise.all([
    getAllWorkTimeDaily(),
    getAllCalendarOverrides(),
  ]);

  const overrides: Record<string, "WORKDAY" | "HOLIDAY" | null> = {};
  for (const row of overrideRows) {
    overrides[row.date] = row.status;
  }

  return calculateGlobalAnalytics({
    records,
    overrides,
    range,
    asOfDateStr,
    timezone,
  });
}
