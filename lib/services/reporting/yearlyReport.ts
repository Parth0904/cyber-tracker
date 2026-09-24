/**
 * Canonical Yearly Reporting Aggregator
 * 
 * Aggregates the 12 monthly reports of the calendar year.
 * Preserves hierarchical drill-down into monthly reports, weekly reviews, and daily sessions.
 */

import { APP_TIMEZONE } from "@/lib/services/metrics/dates";
import { generateMonthlyReport } from "./monthlyReport";
import { DAILY_IDEAL_HOURS } from "@/lib/services/metrics/performance";

export interface MonthlyYearlySummary {
  month: number;
  monthName: string;
  workdayCount: number;
  targetHours: number;
  totalProductiveHours: number;
  learningHours: number;
  huntingHours: number;
  workdayAverage: number;
  completionPercentage: number;
  surplusDeficitHours: number;
  classification: "GREEN" | "YELLOW" | "RED";
  weekendDaysConsumed: number;
  recoveryDaysCount: number;
}

export interface YearlyReport {
  year: number;
  startDate: string;
  endDate: string;

  // Work & Targets
  totalWorkdays: number;
  yearlyTargetHours: number;
  totalProductiveHours: number;
  totalLearningHours: number;
  totalHuntingHours: number;
  targetCompletionPercentage: number;
  surplusDeficitHours: number;
  averageWorkdayHours: number;

  // Monthly Insights
  strongestMonth: { month: number; monthName: string; workdayAverage: number; totalHours: number } | null;
  weakestMonth: { month: number; monthName: string; workdayAverage: number; totalHours: number } | null;

  // Recovery & Patterns
  totalWeekendDaysConsumed: number;
  totalRecoveryDays: number;

  // Cybersecurity Output
  cybersecuritySummary: {
    totalReconHours: number;
    totalTargetsWorkedCount: number;
    totalFindingsCount: number;
    totalValidFindingsCount: number;
    totalReportsSubmitted: number;
    totalValidReports: number;
  };

  // Progression & Trajectory
  progressionSummary: string;
  classification: "GREEN" | "YELLOW" | "RED";

  // Drill-Down: 12 Monthly Reports
  monthlyReports: MonthlyYearlySummary[];
}

export async function generateYearlyReport(
  year: number,
  timezone = APP_TIMEZONE
): Promise<YearlyReport> {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const monthlyReports: MonthlyYearlySummary[] = [];

  let totalWorkdays = 0;
  let totalProductiveHours = 0;
  let totalLearningHours = 0;
  let totalHuntingHours = 0;
  let totalWeekendDaysConsumed = 0;
  let totalRecoveryDays = 0;
  let totalReconHours = 0;
  const allTargetsSet = new Set<string>();
  let totalFindingsCount = 0;
  let totalValidFindingsCount = 0;
  let totalReportsSubmitted = 0;
  let totalValidReports = 0;

  const monthResults = await Promise.all(
    Array.from({ length: 12 }, (_, i) => generateMonthlyReport(year, i + 1, timezone))
  );

  for (let i = 0; i < 12; i++) {
    const m = i + 1;
    const mReport = monthResults[i];
    monthlyReports.push({
      month: m,
      monthName: mReport.monthName,
      workdayCount: mReport.workdayCount,
      targetHours: mReport.monthlyTargetHours,
      totalProductiveHours: mReport.totalProductiveHours,
      learningHours: mReport.totalLearningHours,
      huntingHours: mReport.totalHuntingHours,
      workdayAverage: mReport.monthlyAverageWorkdayHours,
      completionPercentage: mReport.completionPercentage,
      surplusDeficitHours: mReport.surplusDeficitHours,
      classification: mReport.classification,
      weekendDaysConsumed: mReport.weekendDaysConsumed,
      recoveryDaysCount: mReport.recoveryDaysCount,
    });

    totalWorkdays += mReport.workdayCount;
    totalProductiveHours += mReport.totalProductiveHours;
    totalLearningHours += mReport.totalLearningHours;
    totalHuntingHours += mReport.totalHuntingHours;
    totalWeekendDaysConsumed += mReport.weekendDaysConsumed;
    totalRecoveryDays += mReport.recoveryDaysCount;
    totalReconHours += mReport.cybersecuritySummary.reconHours;
    mReport.cybersecuritySummary.targetsWorked.forEach((t) => allTargetsSet.add(t));
    totalFindingsCount += mReport.cybersecuritySummary.findingsCount;
    totalValidFindingsCount += mReport.cybersecuritySummary.validFindingsCount;
    totalReportsSubmitted += mReport.cybersecuritySummary.reportsSubmitted;
    totalValidReports += mReport.cybersecuritySummary.validReports;
  }

  totalProductiveHours = Math.round(totalProductiveHours * 100) / 100;
  totalLearningHours = Math.round(totalLearningHours * 100) / 100;
  totalHuntingHours = Math.round(totalHuntingHours * 100) / 100;

  const yearlyTargetHours = Math.round(totalWorkdays * DAILY_IDEAL_HOURS * 100) / 100;
  const targetCompletionPercentage = yearlyTargetHours > 0
    ? Math.round((totalProductiveHours / yearlyTargetHours) * 1000) / 10
    : 0;
  const surplusDeficitHours = Math.round((totalProductiveHours - yearlyTargetHours) * 100) / 100;
  const averageWorkdayHours = totalWorkdays > 0
    ? Math.round((totalProductiveHours / totalWorkdays) * 100) / 100
    : 0;

  // Strongest and weakest month (among months with logged hours)
  const activeMonths = monthlyReports.filter((m) => m.totalProductiveHours > 0);
  const sortedByAvg = [...activeMonths].sort((a, b) => b.workdayAverage - a.workdayAverage);

  const strongestMonth = sortedByAvg[0]
    ? {
        month: sortedByAvg[0].month,
        monthName: sortedByAvg[0].monthName,
        workdayAverage: sortedByAvg[0].workdayAverage,
        totalHours: sortedByAvg[0].totalProductiveHours,
      }
    : null;

  const weakestMonth = sortedByAvg[sortedByAvg.length - 1]
    ? {
        month: sortedByAvg[sortedByAvg.length - 1].month,
        monthName: sortedByAvg[sortedByAvg.length - 1].monthName,
        workdayAverage: sortedByAvg[sortedByAvg.length - 1].workdayAverage,
        totalHours: sortedByAvg[sortedByAvg.length - 1].totalProductiveHours,
      }
    : null;

  const classification: "GREEN" | "YELLOW" | "RED" =
    averageWorkdayHours >= DAILY_IDEAL_HOURS
      ? "GREEN"
      : averageWorkdayHours >= 6.0
      ? "YELLOW"
      : "RED";

  let progressionSummary = `Year ${year} concluded with ${totalProductiveHours}h logged against a ${yearlyTargetHours}h standard (${targetCompletionPercentage}% achieved).`;
  if (targetCompletionPercentage >= 100) {
    progressionSummary += ` Surplus of ${surplusDeficitHours}h accumulated across ${totalWorkdays} workdays.`;
  } else {
    progressionSummary += ` Work fell short by ${Math.abs(surplusDeficitHours)}h over ${totalWorkdays} workdays.`;
  }

  return {
    year,
    startDate,
    endDate,
    totalWorkdays,
    yearlyTargetHours,
    totalProductiveHours,
    totalLearningHours,
    totalHuntingHours,
    targetCompletionPercentage,
    surplusDeficitHours,
    averageWorkdayHours,
    strongestMonth,
    weakestMonth,
    totalWeekendDaysConsumed,
    totalRecoveryDays,
    cybersecuritySummary: {
      totalReconHours: Math.round(totalReconHours * 100) / 100,
      totalTargetsWorkedCount: allTargetsSet.size,
      totalFindingsCount,
      totalValidFindingsCount,
      totalReportsSubmitted,
      totalValidReports,
    },
    progressionSummary,
    classification,
    monthlyReports,
  };
}
