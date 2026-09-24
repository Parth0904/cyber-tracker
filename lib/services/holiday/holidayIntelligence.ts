/**
 * Canonical Holiday Intelligence & Recovery Simulation Engine
 * 
 * Core source of truth for:
 * 1. "How much time off can I safely take without dropping my productive-work average below 8h/day?"
 * 2. "How long will it take me to return to my current position after taking X holidays?"
 * 
 * Rules:
 * - Baseline: 8.0 productive hours per workday (Learning + Hunting).
 * - Workweek model: Monday–Friday workdays, Saturday & Sunday default holidays.
 * - Available Holiday Calculation:
 *     usableSurplus = actualProductiveHours - (8.0 * elapsedWorkdayRequirement)
 *     availableHolidays = Math.max(0, Math.floor(usableSurplus / 8.0))
 *     Never display negative holidays (minimum 0).
 * - Predictive Recovery Calculator:
 *     Pure simulation (100% predictive, never writes to DB or modifies tracker state).
 *     Enforces 10.0h/day planning ceiling.
 *     Distinguishes maintaining >=8.0h/day ideal vs returning to pre-holiday position.
 *     Supports weekend recovery simulation (Saturday/Sunday as recovery workdays).
 */

import {
  APP_TIMEZONE,
  formatDateInTimezone,
  getTodayDateString,
  getCurrentMonthRange,
} from "../metrics/dates";
import {
  isWeekday,
  isWeekend,
  getRemainingMonthWeekdays,
} from "../metrics/workCalendar";
import {
  DAILY_IDEAL_HOURS,
  REALISTIC_MAX_DAILY_SESSION_HOURS,
  calculateSessionPerformance,
  addCalendarDays,
  SessionRecordInput,
} from "../metrics/performance";

export interface HolidayCapacityResult {
  currentAverage: number;
  idealAverage: number; // 8.0h/workday
  totalProductiveHours: number;
  elapsedWorkdays: number;
  requiredHoursToDate: number;
  surplusHours: number;
  deficitHours: number;
  availableHolidays: number; // Math.max(0, Math.floor(surplusHours / 8.0))
  remainingWorkdaysInMonth: number;
  projectedAverageAfterHolidays: number;
  status: "SURPLUS_AVAILABLE" | "BALANCED" | "DEFICIT";
  message: string;
}

export interface HolidaySimulationInput {
  holidays: number; // e.g. 1, 2, 3, 5, 10
  plannedDailyHours: number; // planned productive hours/day, capped at 10.0h ceiling
  includeWeekends: boolean; // whether Saturday and Sunday are used for recovery
  asOfDateStr?: string;
  timezone?: string;
  // Overrides for deterministic testing
  currentProductiveHours?: number;
  elapsedWorkdays?: number;
}

export interface HolidaySimulationResult {
  // Simulation Inputs
  holidays: number;
  plannedDailyHours: number;
  includeWeekends: boolean;
  planningCeiling: number; // 10.0h
  ceilingCapped: boolean; // true if input was clamped to 10.0h

  // Pre-holiday position
  currentProductiveHours: number;
  currentWorkdayAverage: number;
  currentSurplusHours: number;

  // Perspective 1: Maintaining the Ideal (>= 8.0h/workday)
  maintainsIdeal: boolean;
  projectedAverageAfterHolidays: number;
  idealMaintenanceMessage: string;

  // Perspective 2: Returning to Current Pre-Holiday Position
  holidayDeficitHours: number; // holidays * 8.0h
  totalDeficitToRecover: number;
  dailyRecoveryTarget: number;
  dailyWeekdaySurplus: number; // Math.max(0, plannedDailyHours - 8.0)
  weekendDailyRecoveryHours: number; // plannedDailyHours if includeWeekends else 0
  recoveryWorkdaysRequired: number;
  recoveryCalendarDays: number;
  recoveryWeeks: number;
  recoveryMonths: number;
  projectedRecoveryDate: string;

  // Safety & Warning
  staysUnderCeiling: boolean;
  exceedsCeilingWarning: boolean;
  warningMessage: string | null;
}

/**
 * Calculates current holiday capacity without dropping below 8.0h/workday average.
 */
export function calculateHolidayCapacity(options?: {
  workHours?: number;
  allSessions?: SessionRecordInput[];
  asOfDateStr?: string;
  timezone?: string;
  // Deterministic simulation overrides
  overrideHours?: number;
  overrideElapsedWorkdays?: number;
  overrideRemainingWorkdays?: number;
}): HolidayCapacityResult {
  const tz = options?.timezone || APP_TIMEZONE;
  const todayStr = options?.asOfDateStr || getTodayDateString(tz);
  const monthRange = getCurrentMonthRange(todayStr, tz);

  let totalProductiveHours = 0;
  if (options?.workHours !== undefined) {
    totalProductiveHours = Math.round(options.workHours * 100) / 100;
  } else if (options?.overrideHours !== undefined) {
    totalProductiveHours = Math.round(options.overrideHours * 100) / 100;
  } else if (options?.allSessions) {
    const monthSessions = options.allSessions.filter((s) => {
      if (!s.started_at) return false;
      const d = formatDateInTimezone(s.started_at, tz);
      return d >= monthRange.startStr && d <= monthRange.endStr;
    });
    const perf = calculateSessionPerformance({ allSessions: monthSessions }, 1, tz);
    totalProductiveHours = perf.totalProductiveHours;
  }

  // Calculate elapsed workdays in current month
  let elapsedWorkdays = 0;
  if (options?.overrideElapsedWorkdays !== undefined) {
    elapsedWorkdays = options.overrideElapsedWorkdays;
  } else {
    const [y, m, d] = todayStr.split("-").map(Number);
    for (let day = 1; day <= d; day++) {
      const dateString = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (isWeekday(dateString, tz)) {
        elapsedWorkdays++;
      }
    }
  }

  const remainingWorkdaysInMonth = options?.overrideRemainingWorkdays !== undefined
    ? options.overrideRemainingWorkdays
    : getRemainingMonthWeekdays(todayStr, tz);

  const idealAverage = DAILY_IDEAL_HOURS; // 8.0h
  const requiredHoursToDate = Math.round(elapsedWorkdays * idealAverage * 100) / 100;
  const netSurplus = Math.round((totalProductiveHours - requiredHoursToDate) * 100) / 100;

  const surplusHours = Math.max(0, netSurplus);
  const deficitHours = Math.max(0, -netSurplus);

  // Current average across elapsed workdays
  const currentAverage = elapsedWorkdays > 0
    ? Math.round((totalProductiveHours / elapsedWorkdays) * 100) / 100
    : (totalProductiveHours > 0 ? totalProductiveHours : idealAverage);

  // Available holidays = surplus / 8.0h. If average < 8h, holiday capacity = 0. Never display negative.
  const availableHolidays = currentAverage < idealAverage
    ? 0
    : Math.max(0, Math.floor(surplusHours / idealAverage));

  // Projected average if taking all available holidays
  const projectedAverageAfterHolidays = Math.round((totalProductiveHours / Math.max(1, elapsedWorkdays)) * 100) / 100;

  let status: "SURPLUS_AVAILABLE" | "BALANCED" | "DEFICIT" = "BALANCED";
  let message = "Operating at standard 8.0h/workday pace.";

  if (availableHolidays > 0) {
    status = "SURPLUS_AVAILABLE";
    message = `You can safely take ${availableHolidays} day${availableHolidays > 1 ? "s" : ""} off while preserving an 8.0h/workday average.`;
  } else if (deficitHours > 0) {
    status = "DEFICIT";
    message = `Currently ${deficitHours}h behind standard 8.0h pace. 0 holidays available.`;
  } else {
    status = "BALANCED";
    message = "0 holidays available without dropping below the 8.0h/workday standard.";
  }

  return {
    currentAverage,
    idealAverage,
    totalProductiveHours,
    elapsedWorkdays,
    requiredHoursToDate,
    surplusHours,
    deficitHours,
    availableHolidays,
    remainingWorkdaysInMonth,
    projectedAverageAfterHolidays,
    status,
    message,
  };
}

/**
 * Predictive simulation calculating how long it will take to return to position.
 * Purely mathematical simulation. Never modifies actual database records.
 */
export function simulateHolidayRecovery(input: HolidaySimulationInput): HolidaySimulationResult {
  const tz = input.timezone || APP_TIMEZONE;
  const todayStr = input.asOfDateStr || getTodayDateString(tz);
  const planningCeiling = REALISTIC_MAX_DAILY_SESSION_HOURS; // 10.0h

  // Enforce inputs: holidays >= 0, plannedDailyHours capped at 10.0h
  const holidays = Math.max(0, Math.round(input.holidays));
  const rawPlannedHours = Math.max(0, input.plannedDailyHours);
  const ceilingCapped = rawPlannedHours > planningCeiling;
  const plannedDailyHours = Math.min(planningCeiling, Math.round(rawPlannedHours * 10) / 10);
  const includeWeekends = Boolean(input.includeWeekends);

  // Pre-holiday baseline
  const capacity = calculateHolidayCapacity({
    asOfDateStr: todayStr,
    timezone: tz,
    overrideHours: input.currentProductiveHours,
    overrideElapsedWorkdays: input.elapsedWorkdays,
  });

  const currentProductiveHours = capacity.totalProductiveHours;
  const currentWorkdayAverage = capacity.currentAverage;
  const currentSurplusHours = capacity.surplusHours;

  // 1. Maintaining the Ideal (>= 8.0h/day)
  // Each holiday costs 8.0h against the standard.
  const holidayDeficitHours = Math.round(holidays * DAILY_IDEAL_HOURS * 100) / 100;
  const netPositionAfterHolidays = Math.round((currentSurplusHours - holidayDeficitHours) * 100) / 100;
  const maintainsIdeal = netPositionAfterHolidays >= 0;

  const totalDaysConsidered = Math.max(1, capacity.elapsedWorkdays + holidays);
  const projectedAverageAfterHolidays = Math.round((currentProductiveHours / totalDaysConsidered) * 100) / 100;

  const idealMaintenanceMessage = maintainsIdeal
    ? `Taking ${holidays} holiday${holidays !== 1 ? "s" : ""} preserves an average >= 8.0h/workday.`
    : `Taking ${holidays} holiday${holidays !== 1 ? "s" : ""} drops current average below 8.0h/workday. Recovery is required.`;

  // 2. Returning to Pre-Holiday Position
  // To return to the position held before taking holidays, user must recover holidayDeficitHours + any existing deficit.
  const existingDeficit = capacity.deficitHours;
  const totalDeficitToRecover = Math.round((holidayDeficitHours + existingDeficit) * 100) / 100;

  // Daily surplus generated per day of recovery:
  // Weekday generates: plannedDailyHours - 8.0h
  const dailyWeekdaySurplus = Math.max(0, Math.round((plannedDailyHours - DAILY_IDEAL_HOURS) * 100) / 100);
  // Weekend generates: plannedDailyHours (since weekend baseline is 0.0h)
  const weekendDailyRecoveryHours = includeWeekends ? plannedDailyHours : 0;

  let recoveryWorkdaysRequired = 0;
  let recoveryCalendarDays = 0;
  let projectedRecoveryDate = todayStr;
  let staysUnderCeiling = true;
  let exceedsCeilingWarning = false;
  let warningMessage: string | null = null;

  if (totalDeficitToRecover <= 0 || holidays === 0) {
    // Zero recovery needed
    recoveryWorkdaysRequired = 0;
    recoveryCalendarDays = 0;
    projectedRecoveryDate = todayStr;
  } else if (!includeWeekends && dailyWeekdaySurplus <= 0) {
    // User planned <= 8.0h/day and excluded weekends: surplus generation rate is 0!
    // Cannot recover without higher daily pace or weekend recovery.
    staysUnderCeiling = false;
    exceedsCeilingWarning = true;
    warningMessage = "This plan cannot recover within the selected period at 8.0h/day without weekend recovery. Increase daily hours (up to 10.0h) or enable weekend recovery.";
    // Project with theoretical 2h/day surplus as minimum guide
    recoveryWorkdaysRequired = Math.ceil(totalDeficitToRecover / 2.0);
    recoveryCalendarDays = Math.ceil(recoveryWorkdaysRequired * (7 / 5));
    projectedRecoveryDate = addCalendarDays(todayStr, recoveryCalendarDays);
  } else {
    // Step forward day by day to accurately simulate calendar progression
    let remainingDeficit = totalDeficitToRecover;
    let calendarDaysCount = 0;
    let workdaysCount = 0;

    // Simulate after taking the holidays
    let simulatedDate = addCalendarDays(todayStr, holidays);

    while (remainingDeficit > 0.01 && calendarDaysCount < 365) {
      calendarDaysCount++;
      simulatedDate = addCalendarDays(simulatedDate, 1);
      const isWknd = isWeekend(simulatedDate, tz);

      if (!isWknd) {
        workdaysCount++;
        const recoveredToday = dailyWeekdaySurplus;
        remainingDeficit = Math.max(0, remainingDeficit - recoveredToday);
      } else if (includeWeekends) {
        workdaysCount++;
        const recoveredToday = weekendDailyRecoveryHours;
        remainingDeficit = Math.max(0, remainingDeficit - recoveredToday);
      }
    }

    recoveryWorkdaysRequired = workdaysCount;
    recoveryCalendarDays = calendarDaysCount;
    projectedRecoveryDate = simulatedDate;

    // Check if recovery rate implies > 10.0h/day
    if (plannedDailyHours > planningCeiling || rawPlannedHours > planningCeiling) {
      staysUnderCeiling = false;
      exceedsCeilingWarning = true;
      warningMessage = "Planned hours exceed the 10.0h/day planning ceiling. The simulation has capped pace at 10.0h/day.";
    }
  }

  const recoveryWeeks = Math.round((recoveryCalendarDays / 7) * 10) / 10;
  const recoveryMonths = Math.round((recoveryCalendarDays / 30.4) * 10) / 10;

  return {
    holidays,
    plannedDailyHours,
    includeWeekends,
    planningCeiling,
    ceilingCapped,

    currentProductiveHours,
    currentWorkdayAverage,
    currentSurplusHours,

    maintainsIdeal,
    projectedAverageAfterHolidays,
    idealMaintenanceMessage,

    holidayDeficitHours,
    totalDeficitToRecover,
    dailyRecoveryTarget: plannedDailyHours,
    dailyWeekdaySurplus,
    weekendDailyRecoveryHours,
    recoveryWorkdaysRequired,
    recoveryCalendarDays,
    recoveryWeeks,
    recoveryMonths,
    projectedRecoveryDate,

    staysUnderCeiling,
    exceedsCeilingWarning,
    warningMessage,
  };
}
