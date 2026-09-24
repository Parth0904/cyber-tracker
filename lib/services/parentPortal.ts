/**
 * Parent Portal Architecture Preparation Service
 * 
 * Provides an isolated, read-only compilation surface for a future authenticated
 * Parent Portal. Consumes canonical reporting, metrics, and holiday simulation engines
 * with ZERO database writes and zero side-effects.
 */

import { APP_TIMEZONE, getTodayDateString } from "./metrics/dates";
import { getISOWeekUTC, getISOWeekYearUTC } from "./metrics/dates";
import { generateWeeklyReviewReport } from "./weeklyReview";
import { generateMonthlyReport } from "./reporting/monthlyReport";
import { generateYearlyReport } from "./reporting/yearlyReport";
import {
  calculateHolidayCapacity,
  simulateHolidayRecovery,
  HolidaySimulationResult,
} from "./holiday/holidayIntelligence";
import { getPerformanceOverview } from "./metrics/performance";

export interface ParentPortalWeeklySummary {
  year: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalProductiveHours: number;
  targetHours: number; // 40h
  metWeeklyTarget: boolean;
  workdayAverage: number;
  complianceClassification: string;
  recoveryRequired: boolean;
  unrecoveredHours: number;
  reconHours: number;
  reportsSubmitted: number;
  validReports: number;
}

export interface ParentPortalMonthSummary {
  year: number;
  month: number;
  monthName: string;
  workdayCount: number;
  monthlyTargetHours: number;
  totalProductiveHours: number;
  averageWorkdayHours: number;
  completionPercentage: number;
  completedWeeksCount: number;
  classification: string;
}

export interface ParentPortalYearSummary {
  year: number;
  totalWorkdays: number;
  targetHours: number;
  totalProductiveHours: number;
  averageWorkdayHours: number;
  completionPercentage: number;
}

export interface ParentQuickSimulationScenario {
  holidays: number;
  plannedDailyHours: number;
  includeWeekends: boolean;
  recoveryWorkdaysRequired: number;
  recoveryWeeks: number;
  projectedRecoveryDate: string;
  maintainsIdeal: boolean;
  parentSummary: string;
}

export interface ParentPortalOverview {
  studentName: string;
  timezone: string;
  generatedAt: string;
  todayDate: string;

  // Active status
  holidayCapacity: {
    availableHolidays: number;
    currentAverage: number;
    idealAverage: number;
    surplusHours: number;
    deficitHours: number;
    status: string;
    message: string;
  };

  // Performance summaries
  currentWeek: ParentPortalWeeklySummary;
  currentMonth: ParentPortalMonthSummary;
  currentYear: ParentPortalYearSummary;

  // Quick pre-calculated scenarios for immediate parent visibility
  quickScenarios: ParentQuickSimulationScenario[];
}

/**
 * Compiles a read-only snapshot for the Parent Portal overview.
 */
export async function getParentPortalOverview(options?: {
  timezone?: string;
  asOfDateStr?: string;
}): Promise<ParentPortalOverview> {
  const tz = options?.timezone || APP_TIMEZONE;
  const todayStr = options?.asOfDateStr || getTodayDateString(tz);
  const [year, month, day] = todayStr.split("-").map(Number);

  const nowUTC = new Date(Date.UTC(year, month - 1, day));
  const currentWeekNum = getISOWeekUTC(nowUTC);
  const currentWeekYear = getISOWeekYearUTC(nowUTC);

  // 1. Fetch current weekly, monthly, and yearly reports
  const [weeklyReport, monthlyReport, yearlyReport] = await Promise.all([
    generateWeeklyReviewReport(currentWeekYear, currentWeekNum, tz),
    generateMonthlyReport(year, month, tz),
    generateYearlyReport(year, tz),
  ]);

  // 2. Compute canonical holiday capacity
  const capacity = calculateHolidayCapacity({
    workHours: monthlyReport.totalProductiveHours,
    asOfDateStr: todayStr,
    timezone: tz,
  });

  // 3. Pre-calculate quick scenarios (1, 2, 3, 5 days) at standard 9.0h/day pace
  const scenarioDays = [1, 2, 3, 5];
  const quickScenarios: ParentQuickSimulationScenario[] = scenarioDays.map((days) => {
    const sim = simulateHolidayRecovery({
      holidays: days,
      plannedDailyHours: 9.0,
      includeWeekends: false,
      asOfDateStr: todayStr,
      timezone: tz,
      currentProductiveHours: capacity.totalProductiveHours,
      elapsedWorkdays: capacity.elapsedWorkdays,
    });

    const parentSummary = sim.maintainsIdeal
      ? `Taking ${days} day${days > 1 ? "s" : ""} off will NOT affect Parth's 8.0h/workday standard.`
      : `Taking ${days} day${days > 1 ? "s" : ""} off will require ${sim.recoveryWorkdaysRequired} workdays (${sim.recoveryWeeks} weeks) to recover, completing around ${sim.projectedRecoveryDate} at 9.0h/day.`;

    return {
      holidays: days,
      plannedDailyHours: 9.0,
      includeWeekends: false,
      recoveryWorkdaysRequired: sim.recoveryWorkdaysRequired,
      recoveryWeeks: sim.recoveryWeeks,
      projectedRecoveryDate: sim.projectedRecoveryDate,
      maintainsIdeal: sim.maintainsIdeal,
      parentSummary,
    };
  });

  return {
    studentName: "Parth",
    timezone: tz,
    generatedAt: new Date().toISOString(),
    todayDate: todayStr,

    holidayCapacity: {
      availableHolidays: capacity.availableHolidays,
      currentAverage: capacity.currentAverage,
      idealAverage: capacity.idealAverage,
      surplusHours: capacity.surplusHours,
      deficitHours: capacity.deficitHours,
      status: capacity.status,
      message: capacity.message,
    },

    currentWeek: {
      year: weeklyReport.year,
      weekNumber: weeklyReport.weekNumber,
      startDate: weeklyReport.startDate,
      endDate: weeklyReport.endDate,
      totalProductiveHours: weeklyReport.work.totalProductiveHours,
      targetHours: weeklyReport.work.weeklyTargetHours,
      metWeeklyTarget: weeklyReport.work.surplusDeficitHours >= 0,
      workdayAverage: weeklyReport.work.averageWorkdayHours,
      complianceClassification: weeklyReport.performance.classification,
      recoveryRequired: weeklyReport.recovery.recoveryRequired,
      unrecoveredHours: weeklyReport.work.surplusDeficitHours < 0 ? Math.abs(weeklyReport.work.surplusDeficitHours) : 0,
      reconHours: weeklyReport.cybersecurityOutput.reconHours,
      reportsSubmitted: weeklyReport.cybersecurityOutput.reportsSubmitted,
      validReports: weeklyReport.cybersecurityOutput.validReports,
    },

    currentMonth: {
      year: monthlyReport.year,
      month: monthlyReport.month,
      monthName: monthlyReport.monthName,
      workdayCount: monthlyReport.workdayCount,
      monthlyTargetHours: monthlyReport.monthlyTargetHours,
      totalProductiveHours: monthlyReport.totalProductiveHours,
      averageWorkdayHours: monthlyReport.monthlyAverageWorkdayHours,
      completionPercentage: monthlyReport.completionPercentage,
      completedWeeksCount: monthlyReport.weeklyReports.length,
      classification: monthlyReport.classification,
    },

    currentYear: {
      year: yearlyReport.year,
      totalWorkdays: yearlyReport.totalWorkdays,
      targetHours: yearlyReport.yearlyTargetHours,
      totalProductiveHours: yearlyReport.totalProductiveHours,
      averageWorkdayHours: yearlyReport.averageWorkdayHours,
      completionPercentage: yearlyReport.targetCompletionPercentage,
    },

    quickScenarios,
  };
}

export interface ParentSimulationRequest {
  holidays: number;
  plannedDailyHours?: number;
  includeWeekends?: boolean;
  timezone?: string;
  asOfDateStr?: string;
}

export interface ParentSimulationResponse {
  studentName: string;
  simulation: HolidaySimulationResult;
  parentExplanation: string;
}

/**
 * Calculates an interactive predictive simulation customized with clear parent explanations.
 */
export async function calculateParentHolidaySimulation(
  request: ParentSimulationRequest
): Promise<ParentSimulationResponse> {
  const tz = request.timezone || APP_TIMEZONE;
  const todayStr = request.asOfDateStr || getTodayDateString(tz);
  const plannedHours = request.plannedDailyHours ?? 9.0;
  const includeWeekends = Boolean(request.includeWeekends);

  const overview = await getPerformanceOverview(tz);
  const capacity = calculateHolidayCapacity({
    workHours: overview.currentMonth.performance.totalProductiveHours,
    asOfDateStr: todayStr,
    timezone: tz,
  });

  const sim = simulateHolidayRecovery({
    holidays: request.holidays,
    plannedDailyHours: plannedHours,
    includeWeekends,
    asOfDateStr: todayStr,
    timezone: tz,
    currentProductiveHours: capacity.totalProductiveHours,
    elapsedWorkdays: capacity.elapsedWorkdays,
  });

  let parentExplanation = "";
  if (sim.maintainsIdeal) {
    parentExplanation = `Parth has enough surplus hours that taking ${request.holidays} day${
      request.holidays > 1 ? "s" : ""
    } off will maintain an average above the 8.0h/workday standard. No recovery is required.`;
  } else if (!includeWeekends && plannedHours <= 8.0) {
    parentExplanation = `At a standard 8.0h/workday pace without weekend work, Parth will not generate the extra hours needed to catch up. A recovery pace between 8.5h and 10.0h per workday or weekend study is necessary.`;
  } else {
    parentExplanation = `If Parth takes ${request.holidays} day${
      request.holidays > 1 ? "s" : ""
    } off, he will create a deficit of ${sim.holidayDeficitHours} hours. Working at ${sim.dailyRecoveryTarget}h per day${
      includeWeekends ? " (including weekends)" : " (weekdays only)"
    }, he will fully recover in ${sim.recoveryWorkdaysRequired} workdays (about ${
      sim.recoveryWeeks
    } weeks), returning to pre-holiday standing by ${sim.projectedRecoveryDate}.`;
  }

  return {
    studentName: "Parth",
    simulation: sim,
    parentExplanation,
  };
}
