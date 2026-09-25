import { APP_TIMEZONE, getTodayDateString } from "@/lib/services/metrics/dates";
import { getMonthCalendar } from "@/lib/services/calendar/monthlyCalendar";
import { getGlobalAnalytics } from "@/lib/services/analytics/globalAnalytics";
import { getWorkTimeBetweenDates, WorkTimeDailyRecord } from "@/lib/repositories/workTimeDaily";
import { getCalendarOverridesBetween, CalendarOverrideRecord } from "@/lib/repositories/calendarOverrides";
import { isWeekday, getDayOfWeekName } from "@/lib/services/metrics/workCalendar";
import { ParentPortalTokenRecord } from "@/lib/repositories/parentPortalTokens";

export interface ParentPortalDay {
  date: string;
  dayOfMonth: number;
  dayOfWeek: string;
  plannedStatus: "WORKDAY" | "HOLIDAY";
  dailyTargetHours: number;
  dailyTargetFormatted: string;
  topic: string | null;
  actualWorkFormatted: string;
  actualWorkHours: number;
  actualWorkSeconds: number;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export interface ParentPortalMonthData {
  year: number;
  month: number;
  monthName: string;
  plannedWorkdays: number;
  plannedHolidays: number;
  requiredHours: number;
  actualWorkFormatted: string;
  actualWorkHours: number;
  remainingHours: number;
  averageHoursPerWorkdayFormatted: string;
  daysWorked: number;
  completionPercentage: number;
  firstDayOfWeekOffset: number; // 0 = Mon, 1 = Tue, ... 6 = Sun
  days: ParentPortalDay[];
  requiredDailyPace: number;
  requiredDailyPaceFormatted: string;
}

export interface ParentPortalRecentDay {
  date: string;
  formattedDate: string; // e.g. "Sep 24"
  dayOfWeek: string;     // e.g. "Thu"
  plannedStatus: "WORKDAY" | "HOLIDAY";
  actualWorkFormatted: string;
  actualWorkHours: number;
  actualWorkSeconds: number;
  isToday: boolean;
}

export interface ParentPortalAllTimeSummary {
  totalWorkFormatted: string;
  averagePerTrackedDayFormatted: string;
  averagePerWorkdayFormatted: string;
  activeDaysCount: number;
  highestDay: {
    date: string;
    formattedDate: string;
    formattedDuration: string;
  } | null;
  lowestActiveDay: {
    date: string;
    formattedDate: string;
    formattedDuration: string;
  } | null;
}

export interface ParentPortalPayload {
  studentName: string;
  label: string | null;
  selectedMonth: ParentPortalMonthData;
  recentPerformance: ParentPortalRecentDay[];
  allTimeSummary: ParentPortalAllTimeSummary;
}

/**
 * Compiles canonical, read-only Parent Portal payload for a specific month.
 * Strictly consumes existing Monthly Calendar, Work Time, and Global Analytics engines.
 */
export async function compileParentPortalData(options: {
  tokenRecord: ParentPortalTokenRecord;
  year?: number;
  month?: number;
  timezone?: string;
  asOfDateStr?: string;
}): Promise<ParentPortalPayload> {
  const tz = options.timezone || APP_TIMEZONE;
  const todayStr = options.asOfDateStr || getTodayDateString(tz);

  const [currentYearStr, currentMonthStr] = todayStr.split("-");
  const year = options.year || Number(currentYearStr);
  const month = options.month || Number(currentMonthStr);

  // 1. Authoritative Monthly Calendar data
  const calendarView = await getMonthCalendar(year, month, todayStr, tz);

  const monthDays: ParentPortalDay[] = calendarView.days.map((d) => ({
    date: d.date,
    dayOfMonth: d.dayOfMonth,
    dayOfWeek: d.dayOfWeek,
    plannedStatus: d.plannedStatus,
    dailyTargetHours: d.dailyTargetHours,
    dailyTargetFormatted: d.dailyTargetFormatted,
    topic: d.topic,
    actualWorkFormatted: d.actualWorkFormatted,
    actualWorkHours: d.actualWorkHours,
    actualWorkSeconds: d.actualWorkSeconds,
    isToday: d.isToday,
    isPast: d.isPast,
    isFuture: d.isFuture,
  }));

  // First day of week offset (Monday = 0 ... Sunday = 6)
  const firstDateUtc = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0));
  const firstDayOfWeekOffset = (firstDateUtc.getUTCDay() + 6) % 7;

  // Completion percentage
  const completionPercentage =
    calendarView.monthlyRequiredHours > 0
      ? Math.min(100, Math.round((calendarView.actualWorkedHours / calendarView.monthlyRequiredHours) * 1000) / 10)
      : 0;

  const selectedMonth: ParentPortalMonthData = {
    year: calendarView.year,
    month: calendarView.month,
    monthName: calendarView.monthName,
    plannedWorkdays: calendarView.plannedWorkdays,
    plannedHolidays: calendarView.plannedHolidays,
    requiredHours: calendarView.monthlyRequiredHours,
    actualWorkFormatted: calendarView.actualWorkedFormatted,
    actualWorkHours: calendarView.actualWorkedHours,
    remainingHours: calendarView.remainingHours,
    averageHoursPerWorkdayFormatted: calendarView.averageHoursPerPlannedWorkdayFormatted,
    daysWorked: calendarView.daysWorkedCount,
    completionPercentage,
    firstDayOfWeekOffset,
    days: monthDays,
    requiredDailyPace: calendarView.requiredDailyPace,
    requiredDailyPaceFormatted: calendarView.requiredDailyPaceFormatted,
  };

  // 2. Authoritative Recent Performance (Last 7 Days up to today)
  const recentDays = getPast7Dates(todayStr);
  const startDate = recentDays[0];
  const endDate = recentDays[recentDays.length - 1];

  const [workTimeMap, overridesMap] = await Promise.all([
    getWorkTimeBetweenDates(startDate, endDate),
    getCalendarOverridesBetween(startDate, endDate),
  ]);

  const recentPerformance: ParentPortalRecentDay[] = recentDays.map((dateStr) => {
    const override = overridesMap[dateStr];
    const defaultStatus = isWeekday(dateStr) ? "WORKDAY" : "HOLIDAY";
    const plannedStatus = (override?.status as "WORKDAY" | "HOLIDAY") || defaultStatus;

    const seconds = workTimeMap[dateStr] || 0;
    const hours = Math.round((seconds / 3600) * 100) / 100;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const actualWorkFormatted = `${h}h ${String(m).padStart(2, "0")}m`;

    const d = new Date(`${dateStr}T12:00:00Z`);
    const dayOfWeekShort = d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
    const formattedDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

    return {
      date: dateStr,
      formattedDate,
      dayOfWeek: dayOfWeekShort,
      plannedStatus,
      actualWorkFormatted,
      actualWorkHours: hours,
      actualWorkSeconds: seconds,
      isToday: dateStr === todayStr,
    };
  });

  // 3. Authoritative Global Analytics Lifetime Summary
  const globalAnalytics = await getGlobalAnalytics("all", tz);

  const allTimeSummary: ParentPortalAllTimeSummary = {
    totalWorkFormatted: globalAnalytics.totalWorkFormatted,
    averagePerTrackedDayFormatted: globalAnalytics.averagePerTrackedDayFormatted,
    averagePerWorkdayFormatted: globalAnalytics.averagePerWorkdayFormatted,
    activeDaysCount: globalAnalytics.activeDaysCount,
    highestDay: globalAnalytics.highestDay
      ? {
          date: globalAnalytics.highestDay.date,
          formattedDate: globalAnalytics.highestDay.formattedDate,
          formattedDuration: globalAnalytics.highestDay.formattedDuration,
        }
      : null,
    lowestActiveDay: globalAnalytics.lowestActiveDay
      ? {
          date: globalAnalytics.lowestActiveDay.date,
          formattedDate: globalAnalytics.lowestActiveDay.formattedDate,
          formattedDuration: globalAnalytics.lowestActiveDay.formattedDuration,
        }
      : null,
  };

  return {
    studentName: "Parth",
    label: options.tokenRecord.label,
    selectedMonth,
    recentPerformance,
    allTimeSummary,
  };
}

/**
 * Helper to compute 7 consecutive ISO date strings leading up to and including anchorDateStr.
 */
function getPast7Dates(anchorDateStr: string): string[] {
  const dates: string[] = [];
  const [y, m, d] = anchorDateStr.split("-").map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

  for (let i = 6; i >= 0; i--) {
    const target = new Date(anchor);
    target.setUTCDate(anchor.getUTCDate() - i);
    dates.push(target.toISOString().split("T")[0]);
  }
  return dates;
}
