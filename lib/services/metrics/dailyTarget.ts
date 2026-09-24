/**
 * Canonical Dynamic Daily Target Engine (5-Day Workweek Model)
 * 
 * Central source of truth for answering:
 * "How many productive hours do I need to work today to remain on track?"
 * 
 * Rules:
 * 1. Productive hours = Learning Session Hours + Hunting Session Hours (never clamped).
 * 2. 5-Day Workweek Model:
 *    - Monday–Friday = Working Days
 *    - Saturday & Sunday = Default Holidays
 *    - Daily Ideal = 8.0h | Daily Acceptable = 6.0h
 *    - Weekly Target = 40.0h (5 weekdays × 8.0h)
 *    - Monthly Target = monthWeekdayCount × 8.0h
 *    - Planning Ceiling = 10.0h/day (Never recommend > 10.0h/day)
 * 3. Dynamic Weekend Recovery:
 *    - If remaining weekday required pace > 10.0h/day, Saturday is consumed as RECOVERY_WORKDAY.
 *    - If pace still > 10.0h/day with Saturday, Sunday is ALSO consumed as RECOVERY_WORKDAY.
 * 4. Priority Hierarchy:
 *    - Priority 1: Current week's required pace.
 *    - Priority 2: Monthly pace if weekly requirement is safely satisfied.
 *    - Priority 3: Normal daily ideal of 8.0h.
 * 5. Timezone: Asia/Kolkata canonical source of truth.
 */

import {
  APP_TIMEZONE,
  formatDateInTimezone,
  getTodayDateString,
  getCurrentMonthRange,
} from "./dates";
import {
  DAILY_IDEAL_HOURS,
  REALISTIC_MAX_DAILY_SESSION_HOURS,
  SessionRecordInput,
  calculateSessionPerformance,
  addCalendarDays,
} from "./performance";
import {
  WeekendStatus,
  isWeekend,
  getDayOfWeekName,
  getWorkweekBoundaries,
  getMonthWeekdayCount,
  getRemainingWeekdaysInWorkweek,
  getRemainingMonthWeekdays,
} from "./workCalendar";

export type DailyStudyTargetSource = "WEEKLY" | "MONTHLY" | "DAILY_IDEAL";

export type DailyStudyTargetReason =
  | "DAILY_IDEAL"
  | "WEEKLY_RECOVERY"
  | "MONTHLY_RECOVERY"
  | "WEEKEND_RECOVERY"
  | "WEEKLY_SECURED"
  | "MONTHLY_SECURED"
  | "NORMAL_HOLIDAY";

export interface DailyStudyTargetResult {
  targetHours: number;
  targetSource: DailyStudyTargetSource;
  reason: DailyStudyTargetReason;
  explanation: string; // e.g. "Daily Ideal", "Weekly Recovery", "Monthly Pace", "Weekend recovery required", "Weekend Recovery Day"

  today: {
    date: string;
    completedHours: number;
    remainingHours: number;
    completionPercentage: number;
    huntingHours: number;
    learningHours: number;
  };

  weekly: {
    completedHours: number;
    targetHours: number; // 40.0h standard
    remainingHours: number;
    remainingDays: number; // remaining weekdays in workweek
    requiredDailyPace: number;
    secured: boolean;
    status: "ON_TRACK" | "BEHIND" | "SECURED";
  };

  monthly: {
    completedHours: number;
    targetHours: number; // monthWeekdayCount * 8.0h
    remainingHours: number;
    remainingDays: number; // remaining weekdays in month
    totalWeekdays: number;
    requiredDailyPace: number;
    surplusHours: number;
    secured: boolean;
    status: "ON_TRACK" | "BEHIND" | "SECURED";
  };

  weekendRecovery: {
    required: boolean;
    recoveryWorkdays: ("Saturday" | "Sunday")[];
    saturdayStatus: WeekendStatus;
    sundayStatus: WeekendStatus;
  };

  planningCeiling: number; // 10.0

  recovery: {
    extended: boolean;
    additionalDays: number;
    projectedRecoveryDate: string | null;
  };
}

export interface DailyStudyTargetOptions {
  workSecondsByDate?: Record<string, number>;
  workHoursByDate?: Record<string, number>;
  huntingSessions?: SessionRecordInput[];
  learningSessions?: SessionRecordInput[];
  allSessions?: SessionRecordInput[];
  asOfDateStr?: string; // YYYY-MM-DD
  timezone?: string;

  // Granular parameter overrides for deterministic testing and simulation
  today?: {
    huntingHours?: number;
    learningHours?: number;
    completedHours?: number;
  };
  weekly?: {
    completedHours?: number;
    targetHours?: number;
    remainingDays?: number;
    startDateStr?: string;
    endDateStr?: string;
  };
  monthly?: {
    completedHours?: number;
    targetHours?: number;
    remainingDays?: number;
    startDateStr?: string;
    endDateStr?: string;
    totalWeekdays?: number;
  };
}

/**
 * Pure compiler function calculating today's recommended target
 * based on the 5-day workweek model, progressive weekend recovery, and monthly position.
 */
export function calculateDailyStudyTarget(options?: DailyStudyTargetOptions): DailyStudyTargetResult {
  const tz = options?.timezone || APP_TIMEZONE;
  const todayStr = options?.asOfDateStr || getTodayDateString(tz);

  // 1. Current Workweek Boundaries
  const boundaries = getWorkweekBoundaries(todayStr, tz);
  const weekStartStr = options?.weekly?.startDateStr || boundaries.mondayStr;
  const weekEndStr = options?.weekly?.endDateStr || boundaries.sundayStr; // Full week for completed session collection

  const weeklyTargetHours = options?.weekly?.targetHours !== undefined
    ? options.weekly.targetHours
    : 40.0; // Standard 5 days × 8.0h

  // Remaining normal weekdays in workweek (Mon-Fri)
  let weeklyRemainingWeekdays: number;
  if (options?.weekly?.remainingDays !== undefined) {
    weeklyRemainingWeekdays = options.weekly.remainingDays;
  } else {
    weeklyRemainingWeekdays = getRemainingWeekdaysInWorkweek(todayStr, tz);
  }

  const roundToTwo = (num: number): number => {
    return Math.round(Number(num + "e2")) / 100;
  };

  const getWorkHoursForDate = (dateStr: string): number => {
    if (options?.workHoursByDate && options.workHoursByDate[dateStr] !== undefined) {
      return options.workHoursByDate[dateStr];
    }
    if (options?.workSecondsByDate && options.workSecondsByDate[dateStr] !== undefined) {
      return roundToTwo(options.workSecondsByDate[dateStr] / 3600);
    }
    return 0;
  };

  // Weekly completed hours (all recorded sessions Monday through Sunday)
  let weeklyCompletedHours: number;

  if (options?.weekly?.completedHours !== undefined) {
    weeklyCompletedHours = roundToTwo(options.weekly.completedHours);
  } else if (options?.workSecondsByDate || options?.workHoursByDate) {
    weeklyCompletedHours = roundToTwo(
      boundaries.allDays.reduce((sum, d) => sum + getWorkHoursForDate(d), 0)
    );
  } else {
    const hunting = (options?.huntingSessions || []).filter((s) => {
      if (!s.started_at) return false;
      const d = formatDateInTimezone(s.started_at, tz);
      return d >= weekStartStr && d <= weekEndStr;
    });
    const learning = (options?.learningSessions || []).filter((s) => {
      if (!s.started_at) return false;
      const d = formatDateInTimezone(s.started_at, tz);
      return d >= weekStartStr && d <= weekEndStr;
    });
    const all = (options?.allSessions || []).filter((s) => {
      if (!s.started_at) return false;
      const d = formatDateInTimezone(s.started_at, tz);
      return d >= weekStartStr && d <= weekEndStr;
    });

    const perf = calculateSessionPerformance(
      all.length > 0 ? { allSessions: all } : { huntingSessions: hunting, learningSessions: learning },
      5,
      tz
    );
    weeklyCompletedHours = perf.totalProductiveHours;
  }

  // Today's session hours (always computed regardless of weekly override)
  let todayWorkHours = 0;
  let todayHuntingHours = 0;
  let todayLearningHours = 0;

  if (options?.today?.completedHours !== undefined) {
    todayWorkHours = options.today.completedHours;
  } else if (options?.workSecondsByDate || options?.workHoursByDate) {
    todayWorkHours = getWorkHoursForDate(todayStr);
  } else if (options?.today?.huntingHours !== undefined || options?.today?.learningHours !== undefined) {
    todayHuntingHours = options.today.huntingHours || 0;
    todayLearningHours = options.today.learningHours || 0;
    todayWorkHours = todayHuntingHours + todayLearningHours;
  } else {
    const todayHunting = (options?.huntingSessions || []).filter((s) => {
      if (!s.started_at) return false;
      return formatDateInTimezone(s.started_at, tz) === todayStr;
    });
    const todayLearning = (options?.learningSessions || []).filter((s) => {
      if (!s.started_at) return false;
      return formatDateInTimezone(s.started_at, tz) === todayStr;
    });
    const allToday = (options?.allSessions || []).filter((s) => {
      if (!s.started_at) return false;
      return formatDateInTimezone(s.started_at, tz) === todayStr;
    });

    const todayPerf = calculateSessionPerformance(
      allToday.length > 0
        ? { allSessions: allToday }
        : { huntingSessions: todayHunting, learningSessions: todayLearning },
      1,
      tz
    );
    todayHuntingHours = todayPerf.totalHuntingHours;
    todayLearningHours = todayPerf.totalLearningHours;
    todayWorkHours = todayPerf.totalProductiveHours;
  }

  // Beginning-of-day stabilization
  // Calculate prior work completed before today started to anchor today's target pace
  let priorWeeklyCompletedHours: number;

  if (options?.workSecondsByDate || options?.workHoursByDate) {
    priorWeeklyCompletedHours = Math.max(0, roundToTwo(weeklyCompletedHours - todayWorkHours));
  } else if (options?.weekly?.completedHours !== undefined) {
    if (options?.today?.completedHours !== undefined) {
      priorWeeklyCompletedHours = Math.max(0, roundToTwo(options.weekly.completedHours - options.today.completedHours));
    } else {
      priorWeeklyCompletedHours = options.weekly.completedHours;
      weeklyCompletedHours = roundToTwo(options.weekly.completedHours + todayWorkHours);
    }
  } else {
    priorWeeklyCompletedHours = Math.max(0, roundToTwo(weeklyCompletedHours - todayWorkHours));
  }

  const weeklyRemainingAtStartOfDay = Math.max(0, roundToTwo(weeklyTargetHours - priorWeeklyCompletedHours));
  const weeklySecuredAtStart = priorWeeklyCompletedHours >= weeklyTargetHours;

  const weeklyRemainingHours = roundToTwo(Math.max(0, weeklyTargetHours - weeklyCompletedHours));
  const weeklySecured = weeklyCompletedHours >= weeklyTargetHours;

  // Day context
  const todayIsWeekend = isWeekend(todayStr, tz);
  const dayOfWeekName = getDayOfWeekName(todayStr);

  // 2. Progressive Weekend Recovery Logic & Weekday Pacing (Anchored to beginning-of-day state)
  let saturdayStatus: WeekendStatus = "NORMAL_HOLIDAY";
  let sundayStatus: WeekendStatus = "NORMAL_HOLIDAY";
  let weekendRecoveryRequired = false;
  const recoveryWorkdays: ("Saturday" | "Sunday")[] = [];
  let weeklyRequiredDailyPace = 0;

  if (weeklySecuredAtStart) {
    // 40h weekly target already completed before today started -> weekend is free
    saturdayStatus = "NORMAL_HOLIDAY";
    sundayStatus = "NORMAL_HOLIDAY";
    weekendRecoveryRequired = false;
    weeklyRequiredDailyPace = 0;
  } else if (!todayIsWeekend) {
    // Today is Monday-Friday (normal working day)
    const basePace = weeklyRemainingWeekdays > 0 ? (weeklyRemainingAtStartOfDay / weeklyRemainingWeekdays) : 0;
    const roundedBasePace = roundToTwo(basePace);

    if (roundedBasePace <= REALISTIC_MAX_DAILY_SESSION_HOURS) {
      // Pace is within 10h ceiling on normal weekdays -> weekend remains free
      weeklyRequiredDailyPace = roundedBasePace;
      saturdayStatus = "NORMAL_HOLIDAY";
      sundayStatus = "NORMAL_HOLIDAY";
      weekendRecoveryRequired = false;
    } else {
      // Required weekday pace > 10h/day! Progressively consume Saturday
      weekendRecoveryRequired = true;
      saturdayStatus = "RECOVERY_WORKDAY";
      recoveryWorkdays.push("Saturday");

      const paceWithSaturday = weeklyRemainingAtStartOfDay / (weeklyRemainingWeekdays + 1);
      const roundedSatPace = roundToTwo(paceWithSaturday);

      if (roundedSatPace <= REALISTIC_MAX_DAILY_SESSION_HOURS) {
        // Saturday is sufficient to preserve <= 10h ceiling
        weeklyRequiredDailyPace = roundedSatPace;
        sundayStatus = "NORMAL_HOLIDAY";
      } else {
        // Saturday still insufficient! Sunday also becomes recovery workday
        sundayStatus = "RECOVERY_WORKDAY";
        recoveryWorkdays.push("Sunday");
        const paceWithSunday = weeklyRemainingAtStartOfDay / (weeklyRemainingWeekdays + 2);
        weeklyRequiredDailyPace = roundToTwo(paceWithSunday);
      }
    }
  } else if (dayOfWeekName === "Saturday") {
    // Today IS Saturday
    if (weeklyRemainingAtStartOfDay <= 0) {
      saturdayStatus = "NORMAL_HOLIDAY";
      sundayStatus = "NORMAL_HOLIDAY";
      weeklyRequiredDailyPace = 0;
    } else {
      // Weekend recovery needed
      saturdayStatus = "RECOVERY_WORKDAY";
      recoveryWorkdays.push("Saturday");
      weekendRecoveryRequired = true;

      if (weeklyRemainingAtStartOfDay <= REALISTIC_MAX_DAILY_SESSION_HOURS) {
        // Saturday alone suffices
        weeklyRequiredDailyPace = weeklyRemainingAtStartOfDay;
        sundayStatus = "NORMAL_HOLIDAY";
      } else {
        // Sunday also needed
        sundayStatus = "RECOVERY_WORKDAY";
        recoveryWorkdays.push("Sunday");
        weeklyRequiredDailyPace = roundToTwo(weeklyRemainingAtStartOfDay / 2);
      }
    }
  } else if (dayOfWeekName === "Sunday") {
    // Today IS Sunday
    if (weeklyRemainingAtStartOfDay <= 0) {
      sundayStatus = "NORMAL_HOLIDAY";
      weeklyRequiredDailyPace = 0;
    } else {
      sundayStatus = "RECOVERY_WORKDAY";
      recoveryWorkdays.push("Sunday");
      weekendRecoveryRequired = true;
      weeklyRequiredDailyPace = roundToTwo(weeklyRemainingAtStartOfDay);
    }
  }

  // 3. Current Month Setup & Position
  const monthRange = getCurrentMonthRange(todayStr, tz);
  const [y, m] = todayStr.split("-").map(Number);
  const monthWeekdayCount = options?.monthly?.totalWeekdays !== undefined
    ? options.monthly.totalWeekdays
    : getMonthWeekdayCount(y, m, tz);

  const monthlyTargetHours = options?.monthly?.targetHours !== undefined
    ? options.monthly.targetHours
    : roundToTwo(monthWeekdayCount * DAILY_IDEAL_HOURS);

  let monthlyRemainingWeekdays: number;
  if (options?.monthly?.remainingDays !== undefined) {
    monthlyRemainingWeekdays = options.monthly.remainingDays;
  } else {
    monthlyRemainingWeekdays = getRemainingMonthWeekdays(todayStr, tz);
  }

  // Monthly completed hours
  let monthlyCompletedHours: number;
  if (options?.monthly?.completedHours !== undefined) {
    monthlyCompletedHours = roundToTwo(options.monthly.completedHours);
  } else if (options?.workSecondsByDate || options?.workHoursByDate) {
    let monthWork = 0;
    const [sy, sm, sd] = monthRange.startStr.split("-").map(Number);
    const [, , ed] = monthRange.endStr.split("-").map(Number);
    for (let day = sd; day <= ed; day++) {
      const curDateStr = `${sy}-${String(sm).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      monthWork += getWorkHoursForDate(curDateStr);
    }
    monthlyCompletedHours = roundToTwo(monthWork);
  } else {
    const hunting = (options?.huntingSessions || []).filter((s) => {
      if (!s.started_at) return false;
      const d = formatDateInTimezone(s.started_at, tz);
      return d >= monthRange.startStr && d <= monthRange.endStr;
    });
    const learning = (options?.learningSessions || []).filter((s) => {
      if (!s.started_at) return false;
      const d = formatDateInTimezone(s.started_at, tz);
      return d >= monthRange.startStr && d <= monthRange.endStr;
    });
    const all = (options?.allSessions || []).filter((s) => {
      if (!s.started_at) return false;
      const d = formatDateInTimezone(s.started_at, tz);
      return d >= monthRange.startStr && d <= monthRange.endStr;
    });

    const perf = calculateSessionPerformance(
      all.length > 0 ? { allSessions: all } : { huntingSessions: hunting, learningSessions: learning },
      monthWeekdayCount,
      tz
    );
    monthlyCompletedHours = perf.totalProductiveHours;
  }

  const monthlyRemainingHours = roundToTwo(Math.max(0, monthlyTargetHours - monthlyCompletedHours));
  const monthlySecured = monthlyCompletedHours >= monthlyTargetHours;
  const monthlySurplusHours = roundToTwo(Math.max(0, monthlyCompletedHours - monthlyTargetHours));

  let monthlyRequiredDailyPace = 0;
  if (monthlyRemainingWeekdays > 0) {
    monthlyRequiredDailyPace = roundToTwo(monthlyRemainingHours / monthlyRemainingWeekdays);
  }

  // 4. Priority Hierarchy & Target Determination
  // Priority 1: Current week's required pace.
  // Priority 2: Monthly pace if the weekly requirement was safely satisfied at start of today.
  // Priority 3: Normal daily ideal of 8.0h.
  let targetHours: number;
  let targetSource: DailyStudyTargetSource;
  let reason: DailyStudyTargetReason;
  let explanation: string;
  let extended = false;
  let additionalDays = 0;
  let projectedRecoveryDate: string | null = null;

  if (todayIsWeekend) {
    if (dayOfWeekName === "Saturday" && saturdayStatus === "RECOVERY_WORKDAY") {
      targetSource = "WEEKLY";
      reason = "WEEKEND_RECOVERY";
      explanation = "Weekend Recovery Day";
      targetHours = weeklyRequiredDailyPace;
    } else if (dayOfWeekName === "Sunday" && sundayStatus === "RECOVERY_WORKDAY") {
      targetSource = "WEEKLY";
      reason = "WEEKEND_RECOVERY";
      explanation = "Weekend Recovery Day";
      targetHours = weeklyRequiredDailyPace;
    } else {
      // Normal Weekend Holiday
      targetSource = "DAILY_IDEAL";
      reason = "NORMAL_HOLIDAY";
      explanation = "Daily Ideal";
      targetHours = 0.0;
    }
  } else {
    // Weekday (Monday–Friday)
    if (!weeklySecuredAtStart && weeklyRemainingWeekdays > 0) {
      // Priority 1: Week not secured entering today -> Weekly pace governs for the full day
      targetSource = "WEEKLY";
      if (weekendRecoveryRequired) {
        reason = "WEEKEND_RECOVERY";
        explanation = "Weekend recovery required";
        targetHours = weeklyRequiredDailyPace;
      } else if (weeklyRequiredDailyPace > DAILY_IDEAL_HOURS) {
        reason = "WEEKLY_RECOVERY";
        explanation = "Weekly Recovery";
        targetHours = weeklyRequiredDailyPace;
      } else {
        reason = "WEEKLY_RECOVERY";
        explanation = weeklyRequiredDailyPace === DAILY_IDEAL_HOURS ? "Daily Ideal" : "Weekly Recovery";
        targetHours = weeklyRequiredDailyPace;
      }
    } else if (!monthlySecured && monthlyRemainingWeekdays > 0) {
      // Priority 2: Weekly requirement secured entering today -> Monthly Pace governs
      targetSource = "MONTHLY";
      reason = "MONTHLY_RECOVERY";
      explanation = "Monthly Pace";
      targetHours = Math.min(REALISTIC_MAX_DAILY_SESSION_HOURS, monthlyRequiredDailyPace);
    } else {
      // Priority 3: Both secured or standard pace
      targetSource = "DAILY_IDEAL";
      reason = monthlySecured ? "MONTHLY_SECURED" : "WEEKLY_SECURED";
      explanation = "Daily Ideal";
      targetHours = DAILY_IDEAL_HOURS; // 8.0h
    }
  }

  // 5. Planning Ceiling (10.0h) Guarantee & Extended Horizon
  const planningCeiling = REALISTIC_MAX_DAILY_SESSION_HOURS;
  if (targetHours > planningCeiling) {
    targetHours = planningCeiling;
    weeklyRequiredDailyPace = Math.min(planningCeiling, weeklyRequiredDailyPace);
    extended = true;
    const surplusRate = REALISTIC_MAX_DAILY_SESSION_HOURS - DAILY_IDEAL_HOURS; // 2.0h/day surplus over 8.0h
    const deficit = weeklyRemainingAtStartOfDay - (weeklyRemainingWeekdays * DAILY_IDEAL_HOURS);
    additionalDays = Math.max(1, Math.ceil(deficit / Math.max(1, surplusRate)));
    projectedRecoveryDate = addCalendarDays(todayStr, additionalDays);
  }

  // Clamp targetHours precision
  targetHours = roundToTwo(targetHours);

  // Today's completed hours and comparison
  const todayProductiveHours = roundToTwo(todayWorkHours);
  const todayRemainingHours = roundToTwo(Math.max(0, targetHours - todayProductiveHours));
  const todayCompletionPercentage = targetHours > 0
    ? Math.round((todayProductiveHours / targetHours) * 1000) / 10
    : (todayProductiveHours > 0 ? 100 : 0);

  return {
    targetHours,
    targetSource,
    reason,
    explanation,
    today: {
      date: todayStr,
      completedHours: todayProductiveHours,
      remainingHours: todayRemainingHours,
      completionPercentage: todayCompletionPercentage,
      huntingHours: todayHuntingHours,
      learningHours: todayLearningHours,
    },
    weekly: {
      completedHours: weeklyCompletedHours,
      targetHours: weeklyTargetHours,
      remainingHours: weeklyRemainingHours,
      remainingDays: weeklyRemainingWeekdays,
      requiredDailyPace: weeklyRequiredDailyPace,
      secured: weeklySecured,
      status: weeklySecured ? "SECURED" : (weeklyRequiredDailyPace > planningCeiling ? "BEHIND" : "ON_TRACK"),
    },
    monthly: {
      completedHours: monthlyCompletedHours,
      targetHours: monthlyTargetHours,
      remainingHours: monthlyRemainingHours,
      remainingDays: monthlyRemainingWeekdays,
      totalWeekdays: monthWeekdayCount,
      requiredDailyPace: monthlyRequiredDailyPace,
      surplusHours: monthlySurplusHours,
      secured: monthlySecured,
      status: monthlySecured ? "SECURED" : (monthlyRequiredDailyPace > planningCeiling ? "BEHIND" : "ON_TRACK"),
    },
    weekendRecovery: {
      required: weekendRecoveryRequired,
      recoveryWorkdays,
      saturdayStatus,
      sundayStatus,
    },
    planningCeiling,
    recovery: {
      extended,
      additionalDays,
      projectedRecoveryDate,
    },
  };
}

/**
 * Live canonical daily target service query.
 * Fetches verified active work records and compiles today's target for Asia/Kolkata.
 */
export async function getDailyStudyTarget(timezone = APP_TIMEZONE): Promise<DailyStudyTargetResult> {
  const { getWorkTimeBetweenDates } = await import("@/lib/repositories/workTimeDaily");
  const todayStr = getTodayDateString(timezone);
  const boundaries = getWorkweekBoundaries(todayStr, timezone);
  const monthRange = getCurrentMonthRange(todayStr, timezone);

  const startCandidates = [boundaries.mondayStr, monthRange.startStr, todayStr].sort();
  const endCandidates = [boundaries.sundayStr, monthRange.endStr, todayStr].sort();

  const earliestDate = startCandidates[0];
  const latestDate = endCandidates[endCandidates.length - 1];

  const workSecondsByDate = await getWorkTimeBetweenDates(earliestDate, latestDate);

  return calculateDailyStudyTarget({
    workSecondsByDate,
    timezone,
    asOfDateStr: todayStr,
  });
}
