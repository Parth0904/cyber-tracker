/**
 * Performance Mentor & Time-Off Intelligence - Core Calculations & Types
 * 
 * Pure calculation engine with zero database dependencies.
 * Safe for execution in browser client components, server route handlers, and test suites.
 */

import {
  APP_TIMEZONE,
  getTodayDateString,
} from "./dates";

// Locked standards
const PERIOD_IDEAL_DAILY_HOURS = 6.0;
const PERIOD_ACCEPTABLE_DAILY_HOURS = 5.0;
const REALISTIC_MAX_DAILY_SESSION_HOURS = 10.0;

type PerformanceStatus = "GREEN" | "YELLOW" | "RED";

function classifyPeriodPerformance(averageHours: number): PerformanceStatus {
  if (averageHours >= PERIOD_IDEAL_DAILY_HOURS) return "GREEN";
  if (averageHours >= PERIOD_ACCEPTABLE_DAILY_HOURS) return "YELLOW";
  return "RED";
}

function addCalendarDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export type PerformanceMentorState = "AHEAD" | "ON_TRACK" | "BEHIND";

export interface PerformanceMentorResult {
  state: PerformanceMentorState;
  period: "WEEKLY" | "MONTHLY";
  current: {
    actualHours: number;
    calendarDays: number;
    average: number;
    idealAverage: number;
    surplusHours: number;
    deficitHours: number;
  };
  earnedFreeDays: {
    available: number;
    remainingSurplusHours: number;
  };
  recovery: {
    required: boolean;
    requiredDailyPace: number;
    planningCeiling: number;
    extended: boolean;
    additionalDays: number;
    projectedRecoveryDate: string | null;
    message: string;
  };
  simulation?: TimeOffSimulationResult;
}

export interface TimeOffSimulationOptions {
  actualHours: number;
  calendarDays: number;
  daysOff: number;
  asOfDateStr?: string;
  totalDays?: number;
  remainingDays?: number;
  period?: "WEEKLY" | "MONTHLY";
}

export interface TimeOffSimulationResult {
  daysOff: number;
  projectedHours: number;
  projectedAverage: number;
  projectedStatus: PerformanceStatus;
  projectedSurplusHours: number;
  projectedDeficitHours: number;
  recoveryRequired: boolean;
  resultingRequiredPace: number;
  recoveryExtended: boolean;
  projectedRecoveryDate: string | null;
  summaryMessage: string;
}

export interface PerformanceMentorOptions {
  period: "WEEKLY" | "MONTHLY";
  actualHours: number;
  calendarDays: number;
  asOfDateStr?: string;
  totalDays?: number;
  remainingDays?: number;
  simulateDaysOff?: number;
}

export interface PerformanceMentorOverview {
  weekly: PerformanceMentorResult;
  monthly: PerformanceMentorResult;
  asOfDateStr: string;
}

/**
 * Forward time-off simulator.
 * Non-mutating forward projection: "What happens if I take X days off?"
 */
export function simulateTimeOff(options: TimeOffSimulationOptions): TimeOffSimulationResult {
  const {
    actualHours,
    calendarDays,
    daysOff,
    asOfDateStr = getTodayDateString(APP_TIMEZONE),
    totalDays,
    remainingDays,
  } = options;

  const validDaysOff = Math.max(0, Math.floor(daysOff));
  const projectedHours = Math.round(actualHours * 100) / 100;
  const projectedDays = Math.max(1, calendarDays + validDaysOff);
  const projectedAverage = Math.round((projectedHours / projectedDays) * 100) / 100;
  const projectedStatus = classifyPeriodPerformance(projectedAverage);

  const simulatedIdeal = Math.round(projectedDays * PERIOD_IDEAL_DAILY_HOURS * 100) / 100;

  let projectedSurplusHours = 0;
  let projectedDeficitHours = 0;
  let recoveryRequired = false;
  let resultingRequiredPace = 0;
  let recoveryExtended = false;
  let projectedRecoveryDate: string | null = null;
  let summaryMessage = "";

  if (projectedHours >= simulatedIdeal) {
    projectedSurplusHours = Math.round((projectedHours - simulatedIdeal) * 100) / 100;
    projectedDeficitHours = 0;
    recoveryRequired = false;
    resultingRequiredPace = 0;
    recoveryExtended = false;
    projectedRecoveryDate = null;

    summaryMessage = `Projected average remains Green (${projectedAverage.toFixed(1)}h/day). Remaining surplus: ${projectedSurplusHours.toFixed(1)}h. No recovery required.`;
  } else {
    projectedSurplusHours = 0;
    projectedDeficitHours = Math.round((simulatedIdeal - projectedHours) * 100) / 100;
    recoveryRequired = true;

    // Capacity planning over remaining working days if period parameters provided
    if (remainingDays !== undefined && totalDays !== undefined) {
      const remainingWorkDays = Math.max(0, remainingDays - validDaysOff);
      const remainingTargetHours = Math.max(0, Math.round(totalDays * PERIOD_IDEAL_DAILY_HOURS * 100) / 100 - projectedHours);

      if (remainingWorkDays > 0) {
        resultingRequiredPace = Math.round((remainingTargetHours / remainingWorkDays) * 100) / 100;
      } else {
        resultingRequiredPace = Math.round(remainingTargetHours * 100) / 100;
      }
    } else {
      resultingRequiredPace = projectedDeficitHours;
    }

    if (resultingRequiredPace <= REALISTIC_MAX_DAILY_SESSION_HOURS && (remainingDays === undefined || remainingDays - validDaysOff > 0)) {
      recoveryExtended = false;
      projectedRecoveryDate = null;
      summaryMessage = `Status becomes ${projectedStatus} (${projectedAverage.toFixed(1)}h/day). Deficit: ${projectedDeficitHours.toFixed(1)}h. Recovery requires ${resultingRequiredPace.toFixed(1)}h/day pace.`;
    } else {
      recoveryExtended = true;
      const surplusRate = REALISTIC_MAX_DAILY_SESSION_HOURS - PERIOD_IDEAL_DAILY_HOURS; // 4.0h/day
      const additionalDays = Math.max(1, Math.ceil(projectedDeficitHours / surplusRate));
      projectedRecoveryDate = addCalendarDays(asOfDateStr, validDaysOff + additionalDays);
      summaryMessage = `Status becomes ${projectedStatus} (${projectedAverage.toFixed(1)}h/day). Recovery requires pace exceeding 10.0h/day ceiling. Horizon extended by ${additionalDays} days (projected: ${projectedRecoveryDate}).`;
    }
  }

  return {
    daysOff: validDaysOff,
    projectedHours,
    projectedAverage,
    projectedStatus,
    projectedSurplusHours,
    projectedDeficitHours,
    recoveryRequired,
    resultingRequiredPace,
    recoveryExtended,
    projectedRecoveryDate,
    summaryMessage,
  };
}

/**
 * Pure calculation function for a single period's performance mentor state.
 */
export function calculatePerformanceMentor(options: PerformanceMentorOptions): PerformanceMentorResult {
  const {
    period,
    actualHours,
    calendarDays,
    asOfDateStr = getTodayDateString(APP_TIMEZONE),
    totalDays,
    remainingDays,
    simulateDaysOff,
  } = options;

  const validCalendarDays = Math.max(1, calendarDays);
  const roundedActualHours = Math.round(actualHours * 100) / 100;
  const average = Math.round((roundedActualHours / validCalendarDays) * 100) / 100;
  const idealAverage = PERIOD_IDEAL_DAILY_HOURS; // 6.0h/day
  const idealHours = Math.round(validCalendarDays * idealAverage * 100) / 100;

  // 1. Surplus / Deficit calculation
  let surplusHours = 0;
  let deficitHours = 0;
  let state: PerformanceMentorState = "ON_TRACK";

  if (roundedActualHours > idealHours) {
    surplusHours = Math.round((roundedActualHours - idealHours) * 100) / 100;
    deficitHours = 0;
    state = "AHEAD";
  } else if (roundedActualHours < idealHours) {
    surplusHours = 0;
    deficitHours = Math.round((idealHours - roundedActualHours) * 100) / 100;
    state = "BEHIND";
  } else {
    surplusHours = 0;
    deficitHours = 0;
    state = "ON_TRACK";
  }

  // 2. Earned Free-Day Capacity (Strict Separation: only from surplus, never from deficit)
  let earnedFreeDays = 0;
  let remainingSurplusHours = 0;
  if (surplusHours > 0) {
    earnedFreeDays = Math.floor(surplusHours / idealAverage);
    remainingSurplusHours = Math.round((surplusHours - earnedFreeDays * idealAverage) * 100) / 100;
  }

  // 3. Recovery Intelligence
  const planningCeiling = REALISTIC_MAX_DAILY_SESSION_HOURS; // 10.0h
  let recoveryRequired = false;
  let requiredDailyPace = 0;
  let recoveryExtended = false;
  let additionalDays = 0;
  let projectedRecoveryDate: string | null = null;
  let recoveryMessage = "";

  if (deficitHours > 0) {
    recoveryRequired = true;
    if (remainingDays !== undefined && remainingDays > 0 && totalDays !== undefined) {
      const targetTotal = Math.round(totalDays * idealAverage * 100) / 100;
      const remainingTarget = Math.max(0, targetTotal - roundedActualHours);
      requiredDailyPace = Math.round((remainingTarget / remainingDays) * 100) / 100;

      if (requiredDailyPace <= planningCeiling) {
        recoveryExtended = false;
        additionalDays = 0;
        projectedRecoveryDate = null;
        recoveryMessage = `Pace required: ${requiredDailyPace.toFixed(1)}h/day over remaining ${remainingDays} days to meet ${targetTotal.toFixed(1)}h period target.`;
      } else {
        recoveryExtended = true;
        const surplusRate = planningCeiling - idealAverage; // 4.0h/day
        additionalDays = Math.max(1, Math.ceil(deficitHours / surplusRate));
        projectedRecoveryDate = addCalendarDays(asOfDateStr, additionalDays);
        recoveryMessage = `Deficit (${deficitHours.toFixed(1)}h) requires ${requiredDailyPace.toFixed(1)}h/day, exceeding ${planningCeiling.toFixed(1)}h planning ceiling. Recovery extended by ${additionalDays} days (est. completion: ${projectedRecoveryDate}) at 10.0h/day pace.`;
      }
    } else {
      requiredDailyPace = deficitHours;
      if (requiredDailyPace > planningCeiling) {
        recoveryExtended = true;
        const surplusRate = planningCeiling - idealAverage;
        additionalDays = Math.max(1, Math.ceil(deficitHours / surplusRate));
        projectedRecoveryDate = addCalendarDays(asOfDateStr, additionalDays);
        recoveryMessage = `Deficit of ${deficitHours.toFixed(1)}h exceeds ${planningCeiling.toFixed(1)}h planning ceiling. Horizon extended by ${additionalDays} days (est: ${projectedRecoveryDate}).`;
      } else {
        recoveryExtended = false;
        additionalDays = 0;
        projectedRecoveryDate = null;
        recoveryMessage = `Deficit of ${deficitHours.toFixed(1)}h requires ${requiredDailyPace.toFixed(1)}h/day pace to recover.`;
      }
    }
  } else if (surplusHours > 0) {
    recoveryRequired = false;
    recoveryMessage = `Ahead by ${surplusHours.toFixed(1)}h (${earnedFreeDays} full 6.0h earned free day${earnedFreeDays === 1 ? "" : "s"}${remainingSurplusHours > 0 ? ` + ${remainingSurplusHours.toFixed(1)}h fractional buffer` : ""}).`;
  } else {
    recoveryRequired = false;
    recoveryMessage = `Exactly on track with ${idealAverage.toFixed(1)}h/day baseline.`;
  }

  // 4. Optional simulation attached
  let simulation: TimeOffSimulationResult | undefined;
  if (simulateDaysOff !== undefined && simulateDaysOff >= 0) {
    simulation = simulateTimeOff({
      actualHours: roundedActualHours,
      calendarDays: validCalendarDays,
      daysOff: simulateDaysOff,
      asOfDateStr,
      totalDays,
      remainingDays,
    });
  }

  return {
    state,
    period,
    current: {
      actualHours: roundedActualHours,
      calendarDays: validCalendarDays,
      average,
      idealAverage,
      surplusHours,
      deficitHours,
    },
    earnedFreeDays: {
      available: earnedFreeDays,
      remainingSurplusHours,
    },
    recovery: {
      required: recoveryRequired,
      requiredDailyPace,
      planningCeiling,
      extended: recoveryExtended,
      additionalDays,
      projectedRecoveryDate,
      message: recoveryMessage,
    },
    simulation,
  };
}
