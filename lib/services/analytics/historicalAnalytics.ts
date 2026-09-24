/**
 * Canonical Historical Analytics Service
 * 
 * Central analytical compiler answering:
 * "How am I performing over time?"
 * 
 * Provides unified, canonical time-series historical data across:
 * - Daily perspective (rolling 14/30 days)
 * - Weekly perspective (recent weeks vs 40h standard)
 * - Monthly perspective (monthly target vs actual, workday averages)
 * - Yearly perspective (yearly totals, trend, target achievement)
 */

import { getAllWorkTimeDaily } from "@/lib/repositories/workTimeDaily";
import {
  APP_TIMEZONE,
  formatDateInTimezone,
  getTodayDateString,
  getDatesForWeek,
  getISOWeekUTC,
} from "@/lib/services/metrics/dates";
import {
  isWeekend,
  getDayOfWeekName,
  getMonthWeekdayCount,
} from "@/lib/services/metrics/workCalendar";
import {
  DAILY_IDEAL_HOURS,
  WEEKLY_TARGET_HOURS,
} from "@/lib/services/metrics/performance";

export interface DailyAnalyticsPoint {
  date: string;
  dayOfWeek: string;
  isWeekend: boolean;
  learningHours: number;
  huntingHours: number;
  productiveHours: number;
  targetHours: number; // 8.0 on weekday, 0 on weekend
  variance: number; // productiveHours - targetHours
  metTarget: boolean;
}

export interface WeeklyAnalyticsPoint {
  year: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
  actualHours: number;
  learningHours: number;
  huntingHours: number;
  weeklyTarget: number; // 40.0h
  workdayAverage: number;
  variance: number; // actual - 40.0
  recoveryRequired: boolean;
  weekendUsageHours: number;
  status: "GREEN" | "YELLOW" | "RED";
}

export interface MonthlyAnalyticsPoint {
  year: number;
  month: number;
  monthName: string;
  actualHours: number;
  learningHours: number;
  huntingHours: number;
  monthlyTarget: number; // workdayCount * 8.0h
  workdayCount: number;
  workdayAverage: number;
  variance: number; // actual - monthlyTarget
  completionPercentage: number;
  recoveryDays: number;
  trend: "RISING" | "STABLE" | "FALLING";
  status: "GREEN" | "YELLOW" | "RED";
}

export interface YearlyAnalyticsPoint {
  year: number;
  yearlyProductiveHours: number;
  learningHours: number;
  huntingHours: number;
  yearlyTargetHours: number;
  totalWorkdays: number;
  averageWorkdayHours: number;
  targetAchievement: number; // percentage
  variance: number;
  monthlyTrend: { month: number; monthName: string; hours: number }[];
  status: "GREEN" | "YELLOW" | "RED";
}

export interface HistoricalAnalyticsPayload {
  asOfDate: string;
  daily: DailyAnalyticsPoint[];
  weekly: WeeklyAnalyticsPoint[];
  monthly: MonthlyAnalyticsPoint[];
  yearly: YearlyAnalyticsPoint[];
}

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export async function compileHistoricalAnalytics(
  timezoneOrOptions?: string | { timezone?: string; asOfDateStr?: string; workHoursByDate?: Record<string, number> },
  legacyOptions?: { asOfDateStr?: string; workHoursByDate?: Record<string, number> }
): Promise<HistoricalAnalyticsPayload> {
  let timezone = APP_TIMEZONE;
  let asOfDateStr: string | undefined;
  let passedWorkHours: Record<string, number> | undefined;

  if (typeof timezoneOrOptions === "string") {
    timezone = timezoneOrOptions;
    asOfDateStr = legacyOptions?.asOfDateStr;
    passedWorkHours = legacyOptions?.workHoursByDate;
  } else if (timezoneOrOptions && typeof timezoneOrOptions === "object") {
    timezone = timezoneOrOptions.timezone || APP_TIMEZONE;
    asOfDateStr = timezoneOrOptions.asOfDateStr;
    passedWorkHours = timezoneOrOptions.workHoursByDate;
  }

  const todayStr = asOfDateStr || getTodayDateString(timezone);
  const [currentYear] = todayStr.split("-").map(Number);

  // Fetch canonical authoritative work records
  let workHoursByDate: Record<string, number> = {};
  if (passedWorkHours) {
    workHoursByDate = passedWorkHours;
  } else {
    const allWorkRecords = await getAllWorkTimeDaily();
    for (const r of allWorkRecords) {
      workHoursByDate[r.date] = Math.round((r.active_seconds / 3600) * 100) / 100;
    }
  }

  // 1. Daily Perspective (Rolling past 14 days)
  const daily: DailyAnalyticsPoint[] = [];
  const [cy, cm, cd] = todayStr.split("-").map(Number);
  const todayUtc = new Date(Date.UTC(cy, cm - 1, cd));

  for (let i = 13; i >= 0; i--) {
    const curDate = new Date(todayUtc.getTime() - i * 24 * 60 * 60 * 1000);
    const yyyy = curDate.getUTCFullYear();
    const mm = String(curDate.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(curDate.getUTCDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const isWknd = isWeekend(dateStr, timezone);
    const dayOfWeek = getDayOfWeekName(dateStr);
    const prodH = workHoursByDate[dateStr] || 0.0;
    const targetH = isWknd ? 0.0 : DAILY_IDEAL_HOURS;
    const variance = Math.round((prodH - targetH) * 100) / 100;

    daily.push({
      date: dateStr,
      dayOfWeek,
      isWeekend: isWknd,
      learningHours: 0,
      huntingHours: 0,
      productiveHours: prodH,
      targetHours: targetH,
      variance,
      metTarget: isWknd ? prodH > 0 : prodH >= DAILY_IDEAL_HOURS,
    });
  }

  // 2. Weekly Perspective (Recent 8 weeks)
  const currentWeek = getISOWeekUTC(todayUtc);
  const weekly: WeeklyAnalyticsPoint[] = [];

  for (let wOffset = 7; wOffset >= 0; wOffset--) {
    let targetWeek = currentWeek - wOffset;
    let targetYear = currentYear;
    if (targetWeek <= 0) {
      targetYear = currentYear - 1;
      targetWeek += 52;
    }

    const { start, startStr, endStr } = getDatesForWeek(targetYear, targetWeek, timezone);

    let weekProd = 0;
    let weekdayProd = 0;
    let weekendProd = 0;

    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const dayDate = new Date(start.getTime() + dayIdx * 24 * 60 * 60 * 1000);
      const dStr = formatDateInTimezone(dayDate, timezone);
      const pH = workHoursByDate[dStr] || 0;

      weekProd += pH;

      if (isWeekend(dStr, timezone)) {
        weekendProd += pH;
      } else {
        weekdayProd += pH;
      }
    }

    const actualHours = Math.round(weekProd * 100) / 100;
    const workdayAvg = Math.round((weekdayProd / 5) * 100) / 100;
    const variance = Math.round((actualHours - WEEKLY_TARGET_HOURS) * 100) / 100;
    const recoveryRequired = actualHours < WEEKLY_TARGET_HOURS;
    const status: "GREEN" | "YELLOW" | "RED" =
      workdayAvg >= DAILY_IDEAL_HOURS ? "GREEN" : workdayAvg >= 6.0 ? "YELLOW" : "RED";

    weekly.push({
      year: targetYear,
      weekNumber: targetWeek,
      startDate: startStr,
      endDate: endStr,
      actualHours,
      learningHours: 0,
      huntingHours: 0,
      weeklyTarget: WEEKLY_TARGET_HOURS,
      workdayAverage: workdayAvg,
      variance,
      recoveryRequired,
      weekendUsageHours: Math.round(weekendProd * 100) / 100,
      status,
    });
  }

  // 3. Monthly Perspective (12 months of current year)
  const monthly: MonthlyAnalyticsPoint[] = [];

  for (let m = 1; m <= 12; m++) {
    const daysInMonth = new Date(Date.UTC(currentYear, m, 0)).getUTCDate();

    let mActual = 0;
    let mRecoveryDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${currentYear}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const pH = workHoursByDate[dStr] || 0;
      mActual += pH;

      if (isWeekend(dStr, timezone) && pH > 0) {
        mRecoveryDays++;
      }
    }

    const actualHours = Math.round(mActual * 100) / 100;
    const workdayCount = getMonthWeekdayCount(currentYear, m, timezone);
    const monthlyTarget = Math.round(workdayCount * DAILY_IDEAL_HOURS * 100) / 100;
    const workdayAvg = workdayCount > 0 ? Math.round((actualHours / workdayCount) * 100) / 100 : 0;
    const variance = Math.round((actualHours - monthlyTarget) * 100) / 100;
    const completionPercentage = monthlyTarget > 0 ? Math.round((actualHours / monthlyTarget) * 1000) / 10 : 0;

    const prevMonthHours = monthly[monthly.length - 1]?.actualHours || actualHours;
    let trend: "RISING" | "STABLE" | "FALLING" = "STABLE";
    if (actualHours > prevMonthHours * 1.05) trend = "RISING";
    else if (actualHours < prevMonthHours * 0.95 && actualHours > 0) trend = "FALLING";

    const status: "GREEN" | "YELLOW" | "RED" =
      workdayAvg >= DAILY_IDEAL_HOURS ? "GREEN" : workdayAvg >= 6.0 ? "YELLOW" : "RED";

    monthly.push({
      year: currentYear,
      month: m,
      monthName: MONTH_NAMES[m],
      actualHours,
      learningHours: 0,
      huntingHours: 0,
      monthlyTarget,
      workdayCount,
      workdayAverage: workdayAvg,
      variance,
      completionPercentage,
      recoveryDays: mRecoveryDays,
      trend,
      status,
    });
  }

  // 4. Yearly Perspective (Current Year)
  const totalWorkdays = monthly.reduce((acc, m) => acc + m.workdayCount, 0);
  const yearlyTargetHours = Math.round(totalWorkdays * DAILY_IDEAL_HOURS * 100) / 100;
  const yearlyActual = monthly.reduce((acc, m) => acc + m.actualHours, 0);
  const yearlyWorkdayAvg = totalWorkdays > 0 ? Math.round((yearlyActual / totalWorkdays) * 100) / 100 : 0;
  const targetAchievement = yearlyTargetHours > 0 ? Math.round((yearlyActual / yearlyTargetHours) * 1000) / 10 : 0;

  const yearly: YearlyAnalyticsPoint[] = [
    {
      year: currentYear,
      yearlyProductiveHours: Math.round(yearlyActual * 100) / 100,
      learningHours: 0,
      huntingHours: 0,
      yearlyTargetHours,
      totalWorkdays,
      averageWorkdayHours: yearlyWorkdayAvg,
      targetAchievement,
      variance: Math.round((yearlyActual - yearlyTargetHours) * 100) / 100,
      monthlyTrend: monthly.map((m) => ({ month: m.month, monthName: m.monthName, hours: m.actualHours })),
      status: yearlyWorkdayAvg >= DAILY_IDEAL_HOURS ? "GREEN" : yearlyWorkdayAvg >= 6.0 ? "YELLOW" : "RED",
    },
  ];

  return {
    asOfDate: todayStr,
    daily,
    weekly,
    monthly,
    yearly,
  };
}
