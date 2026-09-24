/**
 * Canonical Performance & Capacity Planning Service
 * 
 * Central source of truth for:
 * - Productive Session Hours (Learning Session Hours + Hunting Session Hours)
 * - 5-Day Cybersecurity Workweek Model:
 *     - Daily: Ideal 8.0h | Acceptable 6.0h
 *     - Weekly: 40.0h target (5 working days × 8.0h)
 *     - Monthly: monthWeekdayCount × 8.0h
 *     - Recovery Planning Ceiling: Realistic max 10.0h/day
 * - Unrestricted actual recorded hours and averages (never clamped)
 * - Workweek accounting with progressive weekend recovery
 * - Asia/Kolkata timezone canonical source of truth
 */

import {
  APP_TIMEZONE,
  formatDateInTimezone,
  getTodayDateString,
  getCurrentMonthRange,
  getRollingDateRange,
} from "./dates";
import {
  getWorkweekBoundaries,
  getMonthWeekdayCount,
  getRemainingWeekdaysInWorkweek,
  getRemainingMonthWeekdays,
} from "./workCalendar";
import type { DailyStudyTargetResult } from "./dailyTarget";

// 1. Hardcoded Performance Standards (5-Day Workweek Model)
export const DAILY_IDEAL_HOURS = 8.0;
export const DAILY_ACCEPTABLE_HOURS = 6.0;

export const WEEKLY_TARGET_HOURS = 40.0;
export const WORKWEEK_DAYS = 5;

export const PERIOD_IDEAL_DAILY_HOURS = 8.0;
export const PERIOD_ACCEPTABLE_DAILY_HOURS = 6.0;

/**
 * Realistic maximum session hours per day used EXCLUSIVELY for capacity and recovery planning.
 * This must NEVER cap, modify, normalize, or alter the user's actual recorded hours or averages.
 */
export const REALISTIC_MAX_DAILY_SESSION_HOURS = 10.0;

export type PerformanceStatus = "GREEN" | "YELLOW" | "RED";

export type RecoveryFeasibility =
  | "ON_TRACK"
  | "RECOVERABLE"
  | "NEAR_CAPACITY"
  | "NOT_REALISTIC_IN_PERIOD";

export interface SessionRecordInput {
  started_at?: string | null;
  ended_at?: string | null;
  duration?: number | null; // in minutes
  type?: string | null;
  module?: string | null;
  isLearning?: boolean;
  [key: string]: any;
}

export interface SessionPerformanceResult {
  totalLearningMinutes: number;
  totalHuntingMinutes: number;
  totalProductiveMinutes: number;
  totalLearningHours: number;
  totalHuntingHours: number;
  totalProductiveHours: number;
  calendarDays: number;
  actualDailyAverage: number;
  idealDailyAverage: number;
  acceptableThresholdHours: number;
  status: PerformanceStatus;
  differenceFromIdeal: number;
  surplusHours: number;
}

export interface CapacityPlanOptions {
  startDateStr: string; // YYYY-MM-DD
  endDateStr: string;   // YYYY-MM-DD
  asOfDateStr: string;  // YYYY-MM-DD (typically today in Asia/Kolkata)
  completedHuntingHours: number;
  completedLearningHours: number;
  isMonthly?: boolean;
  totalTargetHours?: number;
  totalWorkingDays?: number;
  remainingWorkingDays?: number;
}

export interface SessionCapacityPlanResult {
  startDateStr: string;
  endDateStr: string;
  asOfDateStr: string;
  totalCalendarDays: number;
  elapsedCalendarDays: number;
  remainingCalendarDays: number;
  completedProductiveHours: number;
  completedHuntingHours: number;
  completedLearningHours: number;
  currentDailyAverage: number;
  targetDailyAverage: number;       // Always 8.0h in 5-day workweek model
  totalTargetHours: number;         // 40.0h for week, or weekdayCount * 8.0h for month
  remainingTargetHours: number;     // max(0, totalTargetHours - completedHours)
  requiredDailyPace: number;        // remainingTargetHours / remainingWorkingDays
  surplusHours: number;             // completedHours - (elapsedWorkingDays * 8.0)
  bufferDaysCapacity: number;       // Remaining 0h days absorbed while maintaining >= 8.0h/day
  recoveryFeasibility: RecoveryFeasibility;
  extendedRecovery?: {
    deficitHours: number;
    dailyRecoverySurplusRate: number; // 10.0 - 8.0 = 2.0h/day
    extendedDaysNeeded: number;
    projectedRecoveryDate: string;   // YYYY-MM-DD
  };
}

/**
 * Classify a single day's productive session hours against Daily standards:
 * - Ideal (Green): >= 8.0h
 * - Acceptable (Yellow): 6.0h – <8.0h
 * - Below Acceptable (Red): < 6.0h
 */
export function classifyDailyPerformance(hours: number): PerformanceStatus {
  if (hours >= DAILY_IDEAL_HOURS) return "GREEN";
  if (hours >= DAILY_ACCEPTABLE_HOURS) return "YELLOW";
  return "RED";
}

/**
 * Classify a period's daily average productive session hours against Period standards:
 * - Ideal (Green): >= 8.0h/working day (40h/week)
 * - Acceptable (Yellow): 6.0h – <8.0h/working day (30h/week)
 * - Below Acceptable (Red): < 6.0h/working day
 */
export function classifyPeriodPerformance(dailyAverage: number): PerformanceStatus {
  if (dailyAverage >= PERIOD_IDEAL_DAILY_HOURS) return "GREEN";
  if (dailyAverage >= PERIOD_ACCEPTABLE_DAILY_HOURS) return "YELLOW";
  return "RED";
}

/**
 * Calculates unified productive performance from hunting and learning sessions.
 * Productive Hours = Learning Hours + Hunting Hours.
 * 
 * Actual recorded hours and averages are NEVER clamped or capped.
 */
export function calculateSessionPerformance(
  input: {
    workHours?: number;
    workSeconds?: number;
    huntingSessions?: SessionRecordInput[];
    learningSessions?: SessionRecordInput[];
    allSessions?: SessionRecordInput[];
  },
  calendarDays: number,
  _timezone = APP_TIMEZONE
): SessionPerformanceResult {
  let totalProductiveHours = 0;
  let totalProductiveMinutes = 0;

  if (input.workHours !== undefined) {
    totalProductiveHours = Math.round(input.workHours * 100) / 100;
    totalProductiveMinutes = Math.round(totalProductiveHours * 60);
  } else if (input.workSeconds !== undefined) {
    totalProductiveHours = Math.round((input.workSeconds / 3600) * 100) / 100;
    totalProductiveMinutes = Math.round(input.workSeconds / 60);
  } else {
    let huntingMinutes = 0;
    let learningMinutes = 0;

    if (input.allSessions) {
      for (const s of input.allSessions) {
        if (s.ended_at === null && s.duration === undefined) continue;
        const dur = s.duration || 0;
        const isLearning =
          s.isLearning === true ||
          s.module?.toLowerCase() === "learning" ||
          s.type?.toLowerCase() === "learning";
        if (isLearning) {
          learningMinutes += dur;
        } else {
          huntingMinutes += dur;
        }
      }
    } else {
      if (input.huntingSessions) {
        for (const s of input.huntingSessions) {
          if (s.ended_at === null && s.duration === undefined) continue;
          huntingMinutes += s.duration || 0;
        }
      }
      if (input.learningSessions) {
        for (const s of input.learningSessions) {
          if (s.ended_at === null && s.duration === undefined) continue;
          learningMinutes += s.duration || 0;
        }
      }
    }

    totalProductiveMinutes = huntingMinutes + learningMinutes;
    totalProductiveHours = Math.round((totalProductiveMinutes / 60) * 100) / 100;
  }

  const validDays = Math.max(1, calendarDays);
  // Real average without clamping
  const actualDailyAverage = Math.round((totalProductiveHours / validDays) * 100) / 100;

  const isSingleDay = calendarDays === 1;
  const idealDailyAverage = DAILY_IDEAL_HOURS; // 8.0h standard
  const acceptableThresholdHours = DAILY_ACCEPTABLE_HOURS; // 6.0h threshold

  const status = isSingleDay
    ? classifyDailyPerformance(totalProductiveHours)
    : classifyPeriodPerformance(actualDailyAverage);

  const differenceFromIdeal = Math.round((actualDailyAverage - idealDailyAverage) * 100) / 100;
  const surplusHours = Math.round((totalProductiveHours - validDays * idealDailyAverage) * 100) / 100;

  return {
    totalLearningMinutes: 0,
    totalHuntingMinutes: 0,
    totalProductiveMinutes,
    totalLearningHours: 0,
    totalHuntingHours: 0,
    totalProductiveHours,
    calendarDays: validDays,
    actualDailyAverage,
    idealDailyAverage,
    acceptableThresholdHours,
    status,
    differenceFromIdeal,
    surplusHours,
  };
}

/**
 * Helper to compute inclusive calendar day count between two YYYY-MM-DD dates in UTC.
 */
export function getInclusiveDayCount(startStr: string, endStr: string): number {
  const [y1, m1, d1] = startStr.split("-").map(Number);
  const [y2, m2, d2] = endStr.split("-").map(Number);
  const date1 = Date.UTC(y1, m1 - 1, d1);
  const date2 = Date.UTC(y2, m2 - 1, d2);
  const diffMs = date2 - date1;
  return Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1);
}

/**
 * Adds N calendar days to a YYYY-MM-DD string.
 */
export function addCalendarDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Canonical Capacity & Recovery Planning Calculation (5-Day Workweek Model)
 */
export function calculateSessionCapacityPlan(options: CapacityPlanOptions): SessionCapacityPlanResult {
  const {
    startDateStr,
    endDateStr,
    asOfDateStr,
    completedHuntingHours,
    completedLearningHours,
    isMonthly,
  } = options;

  const totalCalendarDays = getInclusiveDayCount(startDateStr, endDateStr);

  let elapsedCalendarDays: number;
  if (asOfDateStr < startDateStr) {
    elapsedCalendarDays = 0;
  } else if (asOfDateStr > endDateStr) {
    elapsedCalendarDays = totalCalendarDays;
  } else {
    elapsedCalendarDays = getInclusiveDayCount(startDateStr, asOfDateStr);
  }

  const remainingCalendarDays = Math.max(0, totalCalendarDays - elapsedCalendarDays);

  const completedProductiveHours =
    Math.round((completedHuntingHours + completedLearningHours) * 100) / 100;

  const currentDailyAverage =
    elapsedCalendarDays > 0
      ? Math.round((completedProductiveHours / elapsedCalendarDays) * 100) / 100
      : 0;

  // Capacity planning protects the 8.0h working day ideal
  const targetDailyAverage = DAILY_IDEAL_HOURS;
  const totalTargetHours = options.totalTargetHours !== undefined
    ? options.totalTargetHours
    : (isMonthly ? (options.totalWorkingDays || 22) * 8.0 : WEEKLY_TARGET_HOURS);

  const remainingTargetHours = Math.round(Math.max(0, totalTargetHours - completedProductiveHours) * 100) / 100;

  const remainingWorkingDays = options.remainingWorkingDays !== undefined
    ? options.remainingWorkingDays
    : (isMonthly ? getRemainingMonthWeekdays(asOfDateStr) : getRemainingWeekdaysInWorkweek(asOfDateStr));

  let requiredDailyPace = 0;
  if (remainingWorkingDays > 0) {
    requiredDailyPace = Math.round((remainingTargetHours / remainingWorkingDays) * 100) / 100;
  }

  const totalWorkingDays = options.totalWorkingDays || (isMonthly ? 22 : 5);
  const elapsedWorkingDays = Math.max(0, totalWorkingDays - remainingWorkingDays);
  const baselineHours = elapsedWorkingDays * targetDailyAverage;
  const surplusHours = Math.round((completedProductiveHours - baselineHours) * 100) / 100;

  // Buffer days: working days that can be absorbed at 0h while remaining days average >= 8.0h/day
  let bufferDaysCapacity = 0;
  if (surplusHours > 0 && remainingWorkingDays > 0) {
    bufferDaysCapacity = Math.min(
      remainingWorkingDays,
      Math.floor(surplusHours / targetDailyAverage)
    );
  }

  // Feasibility classification
  let recoveryFeasibility: RecoveryFeasibility = "ON_TRACK";
  if (requiredDailyPace <= DAILY_IDEAL_HOURS) {
    recoveryFeasibility = "ON_TRACK";
  } else if (requiredDailyPace <= REALISTIC_MAX_DAILY_SESSION_HOURS) {
    if (requiredDailyPace >= 9.5) {
      recoveryFeasibility = "NEAR_CAPACITY";
    } else {
      recoveryFeasibility = "RECOVERABLE";
    }
  } else {
    recoveryFeasibility = "NOT_REALISTIC_IN_PERIOD";
  }

  let extendedRecovery: SessionCapacityPlanResult["extendedRecovery"] | undefined;

  if (recoveryFeasibility === "NOT_REALISTIC_IN_PERIOD") {
    const deficitHours = Math.round(Math.max(0, baselineHours - completedProductiveHours) * 100) / 100;
    // Working at 10.0h planning ceiling provides 10.0 - 8.0 = 2.0h/day recovery surplus
    const dailyRecoverySurplusRate = Math.round((REALISTIC_MAX_DAILY_SESSION_HOURS - DAILY_IDEAL_HOURS) * 100) / 100;
    const extendedDaysNeeded = Math.ceil(deficitHours / Math.max(1, dailyRecoverySurplusRate));
    const projectedRecoveryDate = addCalendarDays(asOfDateStr, extendedDaysNeeded);

    extendedRecovery = {
      deficitHours,
      dailyRecoverySurplusRate,
      extendedDaysNeeded,
      projectedRecoveryDate,
    };
  }

  return {
    startDateStr,
    endDateStr,
    asOfDateStr,
    totalCalendarDays,
    elapsedCalendarDays,
    remainingCalendarDays,
    completedProductiveHours,
    completedHuntingHours,
    completedLearningHours,
    currentDailyAverage,
    targetDailyAverage,
    totalTargetHours,
    remainingTargetHours,
    requiredDailyPace,
    surplusHours,
    bufferDaysCapacity,
    recoveryFeasibility,
    extendedRecovery,
  };
}

export interface PerformanceOverviewResult {
  standards: {
    daily: { ideal: number; acceptable: number };
    period: { ideal: number; acceptable: number };
    weeklyTargetHours: number;
    planningCeiling: number;
  };
  today: {
    date: string;
    performance: SessionPerformanceResult;
  };
  currentWeek: {
    startDateStr: string;
    endDateStr: string;
    workweekStartStr: string;
    workweekEndStr: string;
    performance: SessionPerformanceResult;
    capacityPlan: SessionCapacityPlanResult;
  };
  currentMonth: {
    startDateStr: string;
    endDateStr: string;
    daysInMonth: number;
    weekdayCount: number;
    performance: SessionPerformanceResult;
    capacityPlan: SessionCapacityPlanResult;
  };
  rolling7Days: {
    startDateStr: string;
    endDateStr: string;
    performance: SessionPerformanceResult;
  };
  dailyTarget?: DailyStudyTargetResult;
}

/**
 * Pure compiler function aggregating hunting and learning sessions into a
 * performance overview for today, current week (5-day model), and current month.
 */
export function compilePerformanceOverview(options: {
  workSecondsByDate?: Record<string, number>;
  workHoursByDate?: Record<string, number>;
  huntingSessions?: SessionRecordInput[];
  learningSessions?: SessionRecordInput[];
  timezone?: string;
  asOfDateStr?: string;
}): PerformanceOverviewResult {
  const tz = options.timezone || APP_TIMEZONE;
  const todayStr = options.asOfDateStr || getTodayDateString(tz);

  const getWorkHoursForDate = (dateStr: string): number => {
    if (options.workHoursByDate && options.workHoursByDate[dateStr] !== undefined) {
      return options.workHoursByDate[dateStr];
    }
    if (options.workSecondsByDate && options.workSecondsByDate[dateStr] !== undefined) {
      return Math.round((options.workSecondsByDate[dateStr] / 3600) * 100) / 100;
    }
    if (options.huntingSessions || options.learningSessions) {
      const h = (options.huntingSessions || []).filter(
        (s) => s.started_at && formatDateInTimezone(s.started_at, tz) === dateStr
      );
      const l = (options.learningSessions || []).filter(
        (s) => s.started_at && formatDateInTimezone(s.started_at, tz) === dateStr
      );
      const perf = calculateSessionPerformance({ huntingSessions: h, learningSessions: l }, 1, tz);
      return perf.totalProductiveHours;
    }
    return 0;
  };

  // 1. Today's Performance
  const todayWorkHours = getWorkHoursForDate(todayStr);
  const todayPerformance = calculateSessionPerformance({ workHours: todayWorkHours }, 1, tz);

  // 2. Current Week (5-Day Workweek boundaries)
  const boundaries = getWorkweekBoundaries(todayStr, tz);
  const weekWorkHours = Math.round(
    boundaries.allDays.reduce((sum, d) => sum + getWorkHoursForDate(d), 0) * 100
  ) / 100;

  const weekPerformance = calculateSessionPerformance(
    { workHours: weekWorkHours },
    WORKWEEK_DAYS, // 5 working days
    tz
  );

  const remainingWeekdays = getRemainingWeekdaysInWorkweek(todayStr, tz);
  const weekCapacityPlan = calculateSessionCapacityPlan({
    startDateStr: boundaries.mondayStr,
    endDateStr: boundaries.fridayStr,
    asOfDateStr: todayStr,
    completedHuntingHours: 0,
    completedLearningHours: weekPerformance.totalProductiveHours,
    totalTargetHours: WEEKLY_TARGET_HOURS,
    totalWorkingDays: WORKWEEK_DAYS,
    remainingWorkingDays: remainingWeekdays,
  });

  // 3. Current Month (1st to Month End in Asia/Kolkata)
  const monthRange = getCurrentMonthRange(todayStr, tz);
  const [y, m] = todayStr.split("-").map(Number);
  const monthWeekdayCount = getMonthWeekdayCount(y, m, tz);

  let monthWorkHours = 0;
  const [sy, sm, sd] = monthRange.startStr.split("-").map(Number);
  const [, , ed] = monthRange.endStr.split("-").map(Number);
  for (let day = sd; day <= ed; day++) {
    const curDateStr = `${sy}-${String(sm).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    monthWorkHours += getWorkHoursForDate(curDateStr);
  }
  monthWorkHours = Math.round(monthWorkHours * 100) / 100;

  const monthPerformance = calculateSessionPerformance(
    { workHours: monthWorkHours },
    monthWeekdayCount,
    tz
  );

  const remainingMonthWeekdays = getRemainingMonthWeekdays(todayStr, tz);
  const monthCapacityPlan = calculateSessionCapacityPlan({
    startDateStr: monthRange.startStr,
    endDateStr: monthRange.endStr,
    asOfDateStr: todayStr,
    completedHuntingHours: 0,
    completedLearningHours: monthPerformance.totalProductiveHours,
    isMonthly: true,
    totalTargetHours: monthWeekdayCount * DAILY_IDEAL_HOURS,
    totalWorkingDays: monthWeekdayCount,
    remainingWorkingDays: remainingMonthWeekdays,
  });

  // 4. Rolling 7 Calendar Days (Performance / Average only, no capacity plan)
  const rollingRange = getRollingDateRange(7, tz);
  let rollingWorkHours = 0;
  for (let i = 0; i < 7; i++) {
    const dStr = addCalendarDays(rollingRange.startStr, i);
    rollingWorkHours += getWorkHoursForDate(dStr);
  }
  rollingWorkHours = Math.round(rollingWorkHours * 100) / 100;

  const rollingPerformance = calculateSessionPerformance(
    { workHours: rollingWorkHours },
    7,
    tz
  );

  return {
    standards: {
      daily: { ideal: DAILY_IDEAL_HOURS, acceptable: DAILY_ACCEPTABLE_HOURS },
      period: { ideal: PERIOD_IDEAL_DAILY_HOURS, acceptable: PERIOD_ACCEPTABLE_DAILY_HOURS },
      weeklyTargetHours: WEEKLY_TARGET_HOURS,
      planningCeiling: REALISTIC_MAX_DAILY_SESSION_HOURS,
    },
    today: {
      date: todayStr,
      performance: todayPerformance,
    },
    currentWeek: {
      startDateStr: boundaries.mondayStr,
      endDateStr: boundaries.sundayStr,
      workweekStartStr: boundaries.mondayStr,
      workweekEndStr: boundaries.fridayStr,
      performance: weekPerformance,
      capacityPlan: weekCapacityPlan,
    },
    currentMonth: {
      startDateStr: monthRange.startStr,
      endDateStr: monthRange.endStr,
      daysInMonth: monthRange.daysInMonth,
      weekdayCount: monthWeekdayCount,
      performance: monthPerformance,
      capacityPlan: monthCapacityPlan,
    },
    rolling7Days: {
      startDateStr: rollingRange.startStr,
      endDateStr: rollingRange.endStr,
      performance: rollingPerformance,
    },
  };
}

/**
 * Live canonical performance service query.
 * Fetches verified active work records and returns the compiled performance overview for Asia/Kolkata.
 */
export async function getPerformanceOverview(timezone = APP_TIMEZONE): Promise<PerformanceOverviewResult> {
  const { getWorkTimeBetweenDates } = await import("@/lib/repositories/workTimeDaily");
  const todayStr = getTodayDateString(timezone);
  const boundaries = getWorkweekBoundaries(todayStr, timezone);
  const monthRange = getCurrentMonthRange(todayStr, timezone);
  const rollingRange = getRollingDateRange(7, timezone);

  const startCandidates = [boundaries.mondayStr, monthRange.startStr, rollingRange.startStr, todayStr].sort();
  const endCandidates = [boundaries.sundayStr, monthRange.endStr, rollingRange.endStr, todayStr].sort();

  const earliestDate = startCandidates[0];
  const latestDate = endCandidates[endCandidates.length - 1];

  const workSecondsByDate = await getWorkTimeBetweenDates(earliestDate, latestDate);

  return compilePerformanceOverview({
    workSecondsByDate,
    timezone,
    asOfDateStr: todayStr,
  });
}
