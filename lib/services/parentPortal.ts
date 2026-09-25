/**
 * Parent Portal Architecture Preparation Service
 * 
 * Provides an isolated, read-only compilation surface for a future authenticated
 * Parent Portal. Consumes canonical reporting and monthly calendar planner
 * with ZERO database writes and zero side-effects.
 */

import { APP_TIMEZONE, getTodayDateString } from "./metrics/dates";
import { getISOWeekUTC, getISOWeekYearUTC } from "./metrics/dates";
import { generateWeeklyReviewReport } from "./weeklyReview";
import { generateMonthlyReport } from "./reporting/monthlyReport";
import { generateYearlyReport } from "./reporting/yearlyReport";
import { getMonthCalendar, MonthlyCalendarView } from "./calendar/monthlyCalendar";

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

export interface ParentPortalOverview {
  studentName: string;
  timezone: string;
  generatedAt: string;
  todayDate: string;

  // Monthly Calendar plan & actuals
  calendar: MonthlyCalendarView;

  // Performance summaries
  currentWeek: ParentPortalWeeklySummary;
  currentMonth: ParentPortalMonthSummary;
  currentYear: ParentPortalYearSummary;
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

  // Fetch current weekly, monthly, yearly, and calendar views
  const [weeklyReport, monthlyReport, yearlyReport, calendar] = await Promise.all([
    generateWeeklyReviewReport(currentWeekYear, currentWeekNum, tz),
    generateMonthlyReport(year, month, tz),
    generateYearlyReport(year, tz),
    getMonthCalendar(year, month, todayStr, tz),
  ]);

  return {
    studentName: "Parth",
    timezone: tz,
    generatedAt: new Date().toISOString(),
    todayDate: todayStr,

    calendar,

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
  parentExplanation: string;
}

export async function calculateParentHolidaySimulation(
  request: ParentSimulationRequest
): Promise<ParentSimulationResponse> {
  const days = request.holidays;
  return {
    studentName: "Parth",
    parentExplanation: `Schedule adjustment for ${days} day${days !== 1 ? "s" : ""} can be managed directly via the Monthly Calendar Planner by toggling planned status between WORKDAY and HOLIDAY.`,
  };
}
