/**
 * Canonical Monthly Reporting Aggregator
 * 
 * Aggregates completed weekly reports in the month plus any remaining calendar days.
 * Preserves drill-down capability into weekly reports and individual daily sessions.
 */

import {
  APP_TIMEZONE,
  formatDateInTimezone,
  getISOWeekUTC,
  getDatesForWeek,
} from "@/lib/services/metrics/dates";
import {
  isWeekend,
  getMonthWeekdayCount,
} from "@/lib/services/metrics/workCalendar";
import { DAILY_IDEAL_HOURS } from "@/lib/services/metrics/performance";

export interface MonthlyWeeklySummary {
  weekNumber: number;
  startDate: string;
  endDate: string;
  productiveHours: number;
  learningHours: number;
  huntingHours: number;
  targetHours: number; // 40.0h
  workdayAverage: number;
  completionPercentage: number;
  classification: "GREEN" | "YELLOW" | "RED";
  recoveryRequired: boolean;
  weekendRecoveryDaysCount: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  monthName: string;
  startDate: string;
  endDate: string;

  // Work Metrics
  workdayCount: number; // e.g. 22
  monthlyTargetHours: number; // workdayCount * 8.0h
  totalProductiveHours: number;
  totalLearningHours: number;
  totalHuntingHours: number;
  monthlyAverageWorkdayHours: number;
  completionPercentage: number;
  surplusDeficitHours: number;
  productiveDaysCount: number;
  daysReaching8hCount: number;

  // Recovery Metrics
  recoveryDaysCount: number;
  weekendDaysConsumed: number;

  // Cybersecurity Output
  cybersecuritySummary: {
    reconHours: number;
    targetsWorkedCount: number;
    targetsWorked: string[];
    findingsCount: number;
    validFindingsCount: number;
    submittedFindingsCount: number;
    reportsSubmitted: number;
    validReports: number;
  };

  // Performance Analysis
  notableChanges: string[];
  classification: "GREEN" | "YELLOW" | "RED";

  // Drill-Down: Weekly Building Blocks
  weeklyReports: MonthlyWeeklySummary[];
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

export async function generateMonthlyReport(
  year: number,
  month: number,
  timezone = APP_TIMEZONE
): Promise<MonthlyReport> {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  const monthName = MONTH_NAMES[month] || `Month ${month}`;

  const workdayCount = getMonthWeekdayCount(year, month, timezone);
  const monthlyTargetHours = Math.round(workdayCount * DAILY_IDEAL_HOURS * 100) / 100;

  // 1. In-memory session stubs (work time is canonical)
  const monthTargetSessions: any[] = [];
  const monthLearningSessions: any[] = [];
  const monthFindings: any[] = [];

  // Calculate day-by-day totals for the month
  let productiveDaysCount = 0;
  let daysReaching8hCount = 0;
  let weekendDaysConsumed = 0;
  let totalHuntingDuration = 0;
  let totalLearningDuration = 0;
  let reconDuration = 0;

  const dailyHoursMap: Record<string, number> = {};

  const { getWorkTimeBetweenDates } = await import("@/lib/repositories/workTimeDaily");
  const workTimeMap = await getWorkTimeBetweenDates(startDate, endDate);

  for (let day = 1; day <= daysInMonth; day++) {
    const curDateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayHunting = monthTargetSessions.filter((s) => formatDateInTimezone(s.started_at!, timezone) === curDateStr);
    const dayLearning = monthLearningSessions.filter((s) => formatDateInTimezone(s.started_at!, timezone) === curDateStr);

    const huntMins = dayHunting.reduce((acc, s) => acc + (s.duration || 0), 0);
    const learnMins = dayLearning.reduce((acc, s) => acc + (s.duration || 0), 0);
    const canonicalSec = workTimeMap[curDateStr] || 0;
    const canonicalHours = Math.round((canonicalSec / 3600) * 100) / 100;
    const prodHours = canonicalSec > 0 ? canonicalHours : Math.round(((huntMins + learnMins) / 60) * 100) / 100;

    dailyHoursMap[curDateStr] = prodHours;
    totalHuntingDuration += huntMins;
    totalLearningDuration += learnMins;

    if (prodHours > 0) {
      productiveDaysCount++;
      if (isWeekend(curDateStr, timezone)) {
        weekendDaysConsumed++;
      }
    }
    if (prodHours >= DAILY_IDEAL_HOURS) {
      daysReaching8hCount++;
    }

    const dayRecon = dayHunting.filter((s) => s.type === "Recon");
    reconDuration += dayRecon.reduce((acc, s) => acc + (s.duration || 0), 0);
  }

  const totalHuntingHours = Math.round((totalHuntingDuration / 60) * 100) / 100;
  const totalLearningHours = Math.round((totalLearningDuration / 60) * 100) / 100;
  const totalProductiveHours = Math.round((totalHuntingHours + totalLearningHours) * 100) / 100;

  const monthlyAverageWorkdayHours = workdayCount > 0
    ? Math.round((totalProductiveHours / workdayCount) * 100) / 100
    : 0;
  const completionPercentage = monthlyTargetHours > 0
    ? Math.round((totalProductiveHours / monthlyTargetHours) * 1000) / 10
    : 0;
  const surplusDeficitHours = Math.round((totalProductiveHours - monthlyTargetHours) * 100) / 100;

  // 2. Identify unique ISO weeks in this month for hierarchical drill-down
  const weeksSet = new Set<number>();
  for (let day = 1; day <= daysInMonth; day++) {
    const dt = new Date(Date.UTC(year, month - 1, day));
    const w = getISOWeekUTC(dt);
    weeksSet.add(w);
  }

  const sortedWeeks = Array.from(weeksSet).sort((a, b) => a - b);
  const weeklyReports: MonthlyWeeklySummary[] = [];

  for (const w of sortedWeeks) {
    const { startStr: wkStartStr, endStr: wkEndStr } = getDatesForWeek(year, w, timezone);

    let prodHours = 0;
    let weekdayTotalHours = 0;
    let weekendRecoveryDaysCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const curDateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (curDateStr >= wkStartStr && curDateStr <= wkEndStr) {
        const dHours = dailyHoursMap[curDateStr] || 0;
        prodHours += dHours;
        if (!isWeekend(curDateStr, timezone)) {
          weekdayTotalHours += dHours;
        } else if (dHours > 0) {
          weekendRecoveryDaysCount++;
        }
      }
    }

    prodHours = Math.round(prodHours * 100) / 100;
    weekdayTotalHours = Math.round(weekdayTotalHours * 100) / 100;
    const workdayAverage = Math.round((weekdayTotalHours / 5) * 100) / 100;
    const huntHours = 0;
    const learnHours = 0;

    const completionPercentage = Math.round((prodHours / 40.0) * 1000) / 10;
    let classification: "GREEN" | "YELLOW" | "RED" = "RED";
    if (prodHours >= 40.0) classification = "GREEN";
    else if (prodHours >= 25.0) classification = "YELLOW";

    const recoveryRequired = prodHours < 40.0;

    weeklyReports.push({
      weekNumber: w,
      startDate: wkStartStr,
      endDate: wkEndStr,
      productiveHours: prodHours,
      learningHours: learnHours,
      huntingHours: huntHours,
      targetHours: 40.0,
      workdayAverage,
      completionPercentage,
      classification,
      recoveryRequired,
      weekendRecoveryDaysCount,
    });
  }

  // Recovery summary
  const recoveryDaysCount = weeklyReports.reduce((acc, w) => acc + w.weekendRecoveryDaysCount, 0);

  // Cybersecurity Output
  const targetsSet = new Set(monthTargetSessions.map((s) => s.target).filter(Boolean));
  const validReports = monthFindings.filter((f) => f.status === "Valid").length;
  const reportsSubmitted = monthFindings.length;

  const cybersecuritySummary = {
    reconHours: Math.round((reconDuration / 60) * 100) / 100,
    targetsWorkedCount: targetsSet.size,
    targetsWorked: Array.from(targetsSet) as string[],
    findingsCount: monthFindings.length,
    validFindingsCount: validReports,
    submittedFindingsCount: reportsSubmitted,
    reportsSubmitted,
    validReports,
  };

  // Performance classification
  const classification: "GREEN" | "YELLOW" | "RED" =
    monthlyAverageWorkdayHours >= DAILY_IDEAL_HOURS
      ? "GREEN"
      : monthlyAverageWorkdayHours >= 6.0
      ? "YELLOW"
      : "RED";

  // Notable changes
  const notableChanges: string[] = [];
  if (completionPercentage >= 100) {
    notableChanges.push(`Secured monthly target with ${surplusDeficitHours}h surplus (${completionPercentage}% achieved).`);
  } else {
    notableChanges.push(`Completed ${completionPercentage}% of monthly target with a ${Math.abs(surplusDeficitHours)}h deficit.`);
  }

  if (weeklyReports.length >= 2) {
    const firstHalf = weeklyReports.slice(0, Math.ceil(weeklyReports.length / 2));
    const secondHalf = weeklyReports.slice(Math.ceil(weeklyReports.length / 2));
    const avgFirst = firstHalf.reduce((acc, w) => acc + w.productiveHours, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((acc, w) => acc + w.productiveHours, 0) / secondHalf.length;
    if (avgSecond > avgFirst * 1.1) {
      notableChanges.push("Pace accelerated significantly in the second half of the month.");
    } else if (avgSecond < avgFirst * 0.9) {
      notableChanges.push("Productive work volume slowed in the later weeks of the month.");
    } else {
      notableChanges.push("Output and consistency remained balanced across all weeks.");
    }
  }

  return {
    year,
    month,
    monthName,
    startDate,
    endDate,
    workdayCount,
    monthlyTargetHours,
    totalProductiveHours,
    totalLearningHours,
    totalHuntingHours,
    monthlyAverageWorkdayHours,
    completionPercentage,
    surplusDeficitHours,
    productiveDaysCount,
    daysReaching8hCount,
    recoveryDaysCount,
    weekendDaysConsumed,
    cybersecuritySummary,
    notableChanges,
    classification,
    weeklyReports,
  };
}
