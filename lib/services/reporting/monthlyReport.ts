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
  const { getMonthCalendar } = await import("@/lib/services/calendar/monthlyCalendar");
  const cal = await getMonthCalendar(year, month, undefined, timezone);

  const daysInMonth = cal.totalDays;
  const startDate = cal.startDate;
  const endDate = cal.endDate;
  const monthName = cal.monthName;

  const workdayCount = cal.plannedWorkdays;
  const monthlyTargetHours = cal.monthlyRequiredHours;
  const totalProductiveHours = cal.actualWorkedHours;

  let daysReaching8hCount = 0;
  let weekendDaysConsumed = 0;
  const dailyHoursMap: Record<string, number> = {};

  for (const day of cal.days) {
    dailyHoursMap[day.date] = day.actualWorkHours;
    if (day.actualWorkHours >= 8.0) {
      daysReaching8hCount++;
    }
    if (day.actualWorkHours > 0 && isWeekend(day.date, timezone)) {
      weekendDaysConsumed++;
    }
  }

  const productiveDaysCount = cal.daysWorkedCount;
  const monthlyAverageWorkdayHours = cal.averageHoursPerPlannedWorkday;
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
  const cybersecuritySummary = {
    reconHours: 0,
    targetsWorkedCount: 0,
    targetsWorked: [] as string[],
    findingsCount: 0,
    validFindingsCount: 0,
    submittedFindingsCount: 0,
    reportsSubmitted: 0,
    validReports: 0,
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
    totalLearningHours: 0,
    totalHuntingHours: 0,
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
