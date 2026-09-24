import { calculateConsistencyForPeriod } from "@/lib/services/consistency";
import { getAllDailyEntries } from "@/lib/repositories/dailyEntries";
import { getCorrelationDiagnostics } from "@/lib/services/correlationEngine";
import { saveWeeklyReview } from "@/lib/repositories/weeklyReview";
import {
  APP_TIMEZONE,
  formatDateInTimezone,
  getISOWeekUTC,
  getISOWeekYearUTC,
  getDatesForWeek,
} from "@/lib/services/metrics/dates";
import {
  buildComparisonMetric,
  buildScoreComparisonMetric,
  ComparisonMetric,
} from "@/lib/services/metrics/comparisons";

import {
  isWeekend,
  getDayOfWeekName,
} from "@/lib/services/metrics/workCalendar";
import {
  DAILY_IDEAL_HOURS,
  WEEKLY_TARGET_HOURS,
  REALISTIC_MAX_DAILY_SESSION_HOURS,
} from "@/lib/services/metrics/performance";

export {
  APP_TIMEZONE,
  getISOWeekUTC,
  getISOWeekYearUTC,
  getDatesForWeek,
  formatDateInTimezone,
} from "@/lib/services/metrics/dates";
export type { ComparisonMetric } from "@/lib/services/metrics/comparisons";

export type TargetRanking = {
  name: string;
  hours: number;
  reportsSubmitted: number;
  validReports: number;
  hoursPerValidReport: number | string;
};

export type TopicRanking = {
  name: string;
  hours: number;
  sessions: number;
  lastStudied: string;
};

export type HabitReviewDetail = {
  readingDays: number;
  readingDaysDiffPrev: number;
  readingDaysDiff30d: number;
  workoutCount: number;
  workoutCountDiffPrev: number;
  workoutCountDiff30d: number;
  completionRate: number;
  consistencyScore: number;
};

export type WeeklyReviewReport = {
  year: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
  
  // Section 1: Executive Summary
  executiveSummary: {
    consistencyState: "green" | "amber" | "red";
    consistencyScore: number;
    consistencyTrendText: string;
    summaryText: string;
  };
  
  // Section 2: Work Summary
  workSummary: {
    totalHuntingHours: number;
    totalLearningHours: number;
    totalSessions: number;
    targetsCount: number;
    topicsCount: number;
    reportsSubmitted: number;
    validReports: number;
    targetsWorkedOn: string[];
    topicsStudied: string[];
  };
  
  // Section 3: Comparison
  comparison: {
    huntingHours: ComparisonMetric;
    learningHours: ComparisonMetric;
    consistency: ComparisonMetric;
    reportsSubmitted: ComparisonMetric;
    validReports: ComparisonMetric;
  };
  
  // Section 4: Top Targets
  topTargetsRanked: TargetRanking[];
  
  // Section 5: Top Learning
  topLearningRanked: TopicRanking[];
  
  // Section 6: Discoveries
  discoveries: {
    text: string;
    confidence: "High" | "Medium" | "Low";
  }[];
  
  // Section 7: Habit Review
  habitReview: HabitReviewDetail;
  
  // Section 8: Achievements
  achievements: string[];
  
  // Section 9: Recommendations
  recommendations: string[];
  
  // Section 10: Next Week Snapshot
  nextWeekSnapshot: {
    focusTarget: string;
    focusTopic: string;
    consistencyGoal: string;
    planningSummary: string;
  };

  // Section 11: 5-Day Workweek Core Reporting (Step 8)
  work: {
    totalProductiveHours: number;
    learningHours: number;
    huntingHours: number;
    productiveDaysCount: number;
    averageWorkdayHours: number;
    dailyTargetHours: number; // 8.0
    weeklyTargetHours: number; // 40.0
    completionPercentage: number;
    surplusDeficitHours: number; // completed - 40.0
  };

  performance: {
    dailyDistribution: {
      date: string;
      dayOfWeek: string;
      isWeekend: boolean;
      learningHours: number;
      huntingHours: number;
      productiveHours: number;
      metTarget: boolean;
    }[];
    strongestDay: { date: string; dayOfWeek: string; hours: number } | null;
    weakestDay: { date: string; dayOfWeek: string; hours: number } | null;
    daysReaching8hCount: number;
    daysBelowTargetCount: number;
    classification: "GREEN" | "YELLOW" | "RED";
  };

  recovery: {
    recoveryRequired: boolean;
    requiredRecoveryPace: number;
    saturdayRecoveryStatus: "NORMAL_HOLIDAY" | "RECOVERY_WORKDAY";
    sundayRecoveryStatus: "NORMAL_HOLIDAY" | "RECOVERY_WORKDAY";
    maxDailyPaceReached: number;
    ceilingApproachedOrExceeded: boolean;
  };

  cybersecurityOutput: {
    reconSessionsCount: number;
    reconHours: number;
    targetsWorkedCount: number;
    targetsWorked: { name: string; hours: number; reportsSubmitted: number; validReports: number }[];
    findingsCount: number;
    validFindingsCount: number;
    submittedFindingsCount: number;
    reportsSubmitted: number;
    validReports: number;
  };
};





function calculateConsistencyForWeek(
  weekStart: Date,
  timezone: string,
  entries: any[],
  targetSessions: any[],
  learningSessions: any[],
  activities: any[],
  findings: any[]
) {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
    dates.push(formatDateInTimezone(d, timezone));
  }
  return calculateConsistencyForPeriod(
    dates,
    entries,
    targetSessions,
    learningSessions,
    activities,
    findings,
    timezone
  );
}

export async function generateWeeklyReviewReport(year: number, week: number, timezone = APP_TIMEZONE): Promise<WeeklyReviewReport> {
  const { start, startStr, endStr } = getDatesForWeek(year, week, timezone);
  
  // Calculate previous week boundaries
  let prevWeek = week - 1;
  let prevYear = year;
  if (prevWeek === 0) {
    prevYear = year - 1;
    const dec28 = new Date(Date.UTC(prevYear, 11, 28));
    prevWeek = getISOWeekUTC(dec28);
  }
  const { start: prevStart } = getDatesForWeek(prevYear, prevWeek, timezone);

  const start30d = new Date(start.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 1. Fetch data
  const allEntries = await getAllDailyEntries();
  const allTargetSessions: any[] = [];
  const allLearningSessions: any[] = [];
  const allFindings: any[] = [];
  const allActivities: any[] = [];

  // ================= SECTION 2: WORK SUMMARY =================
  const totalHuntingHours = 0;
  const totalLearningHours = 0;
  const totalSessions = 0;
  
  const targetsWorkedOn: string[] = [];
  const topicsStudied: string[] = [];
  
  const reportsSubmitted = 0;
  const validReports = 0;

  const consistencyScore = calculateConsistencyForWeek(start, timezone, allEntries, allTargetSessions, allLearningSessions, allActivities, allFindings);

  // ================= PREVIOUS WEEK VALUES =================
  const prevHuntingHours = 0;
  const prevLearningHours = 0;
  const prevReportsSubmitted = 0;
  const prevValidReports = 0;
  const prevConsistency = calculateConsistencyForWeek(prevStart, timezone, allEntries, allTargetSessions, allLearningSessions, allActivities, allFindings);

  // ================= 30-DAY AVERAGE BASELINE (SCALED WEEKLY) =================
  const avgHuntingHoursWeekly30d = 0;
  const avgLearningHoursWeekly30d = 0;
  const avgReportsWeekly30d = 0;
  const avgValidWeekly30d = 0;

  let sumDailyConsistency30d = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(start30d.getTime() + i * 24 * 60 * 60 * 1000);
    const score = calculateConsistencyForWeek(d, timezone, allEntries, allTargetSessions, allLearningSessions, allActivities, allFindings);
    sumDailyConsistency30d += score;
  }
  const avgConsistency30d = Math.round(sumDailyConsistency30d / 30);

  // ================= SECTION 3: COMPARISON =================
  const comparison = {
    huntingHours: buildComparisonMetric(totalHuntingHours, prevHuntingHours, avgHuntingHoursWeekly30d),
    learningHours: buildComparisonMetric(totalLearningHours, prevLearningHours, avgLearningHoursWeekly30d),
    consistency: buildScoreComparisonMetric(consistencyScore, prevConsistency, avgConsistency30d),
    reportsSubmitted: buildComparisonMetric(reportsSubmitted, prevReportsSubmitted, avgReportsWeekly30d),
    validReports: buildComparisonMetric(validReports, prevValidReports, avgValidWeekly30d),
  };

  // ================= SECTION 4: TOP TARGETS =================
  const topTargetsRanked: TargetRanking[] = [];

  // ================= SECTION 5: TOP LEARNING =================
  const topLearningRanked: TopicRanking[] = [];

  // ================= SECTION 7: HABIT REVIEW =================
  const completionRate = 100;

  const habitReview: HabitReviewDetail = {
    readingDays: 0,
    readingDaysDiffPrev: 0,
    readingDaysDiff30d: 0,
    workoutCount: 0,
    workoutCountDiffPrev: 0,
    workoutCountDiff30d: 0,
    completionRate,
    consistencyScore,
  };

  // ================= SECTION 6: DISCOVERIES =================
  const diagnostics = await getCorrelationDiagnostics();
  const discoveries: { text: string; confidence: "High" | "Medium" | "Low" }[] = [];
  const recommendations: string[] = [];

  if (diagnostics.insights.learning?.status === "success" && diagnostics.insights.learning.topics) {
    const topTopic = diagnostics.insights.learning.topics[0];
    if (topTopic && topTopic.attributedReports > 0) {
      discoveries.push({
        text: `Studies on topic '${topTopic.name}' preceded ${topTopic.attributedReports} findings within a 7-day window.`,
        confidence: diagnostics.insights.learning.confidence || "Low",
      });
      recommendations.push(`Rotate focus back to learning topic '${topTopic.name}' to exploit recently acquired techniques.`);
    }
  }

  if (diagnostics.insights.learning?.status === "success" && diagnostics.insights.learning.topics) {
    const topTopic = diagnostics.insights.learning.topics[0];
    if (topTopic && topTopic.attributedReports > 0) {
      discoveries.push({
        text: `Studies on topic '${topTopic.name}' preceded ${topTopic.attributedReports} findings within a 7-day window.`,
        confidence: diagnostics.insights.learning.confidence || "Low",
      });
      recommendations.push(`Rotate focus back to learning topic '${topTopic.name}' to exploit recently acquired techniques.`);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("More data is required to generate tailored operational recommendations.");
  }

  // ================= SECTION 8: ACHIEVEMENTS =================
  const achievements: string[] = [];
  const weeksMap: Record<string, { year: number; week: number; start: Date; huntingHours: number; learningHours: number; reportsCount: number; entries: any[]; sessions: any[] }> = {};
  
  for (const entry of allEntries) {
    const parts = entry.date.split("-").map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    const w = getISOWeekUTC(d);
    const y = getISOWeekYearUTC(d);
    const key = `${y}-${w}`;
    if (!weeksMap[key]) {
      const { start: wkStart } = getDatesForWeek(y, w, timezone);
      weeksMap[key] = { year: y, week: w, start: wkStart, huntingHours: 0, learningHours: 0, reportsCount: 0, entries: [], sessions: [] };
    }
    weeksMap[key].entries.push(entry);
  }

  const weeksList = Object.values(weeksMap).map(wk => {
    const score = calculateConsistencyForWeek(wk.start, timezone, allEntries, [], [], [], []);
    return { ...wk, consistencyScore: score };
  });

  const otherWeeks = weeksList.filter(wk => !(wk.year === year && wk.week === week));

  if (totalHuntingHours > 0 && otherWeeks.every(wk => totalHuntingHours >= wk.huntingHours)) {
    achievements.push(`New record for highest weekly hunting hours reached: ${totalHuntingHours.toFixed(1)} hours.`);
  }
  if (totalLearningHours > 0 && otherWeeks.every(wk => totalLearningHours >= wk.learningHours)) {
    achievements.push(`New record for highest weekly learning hours reached: ${totalLearningHours.toFixed(1)} hours.`);
  }
  if (consistencyScore > 0 && otherWeeks.every(wk => consistencyScore >= wk.consistencyScore)) {
    achievements.push(`Highest weekly consistency score achieved in project history: ${consistencyScore}%.`);
  }
  if (reportsSubmitted > 0 && otherWeeks.every(wk => reportsSubmitted >= wk.reportsCount)) {
    achievements.push(`Most reports submitted in a single week in project history: ${reportsSubmitted} reports.`);
  }

  if (achievements.length === 0) {
    achievements.push("More data is required to establish weekly achievement benchmarks.");
  }

  // ================= SECTION 10: NEXT WEEK SNAPSHOT =================
  const focusTarget = topTargetsRanked[0]?.name 
    ? `Focus on Target '${topTargetsRanked[0].name}' as it represents the highest operational investment.` 
    : "Determine and register a primary target for the upcoming cycle.";

  const focusTopic = topLearningRanked[0]?.name
    ? `Continue study of Topic '${topLearningRanked[0].name}' to support active target research.`
    : "Establish a primary learning topic in Settings/Learning to structure next week's studies.";

  const consistencyGoal = consistencyScore < 75
    ? "Structure routine to improve consistency score back above the 75% target threshold."
    : `Maintain current habit routines and hunting focus to preserve high consistency score (${consistencyScore}%).`;

  const planningSummary = `Data suggests allocating primary sessions to '${topTargetsRanked[0]?.name || "N/A"}' and maintaining habit tracking completeness above 75%.`;

  const nextWeekSnapshot = {
    focusTarget,
    focusTopic,
    consistencyGoal,
    planningSummary,
  };

  // ================= SECTION 1: EXECUTIVE SUMMARY =================
  let consistencyState: "green" | "amber" | "red" = "red";
  if (consistencyScore >= 75) consistencyState = "green";
  else if (consistencyScore >= 40) consistencyState = "amber";

  let consistencyTrendText = "Consistency declined compared to last week.";
  const consistencyDiffPrev = comparison.consistency.prevWeekDiffPercent;
  if (consistencyDiffPrev > 0) {
    consistencyTrendText = "Overall this week was more consistent than last week.";
  } else if (consistencyDiffPrev === 0) {
    consistencyTrendText = "Consistency remained stable compared to last week.";
  }

  const summaryText = `This week yielded ${totalHuntingHours.toFixed(1)}h of hunting and ${totalLearningHours.toFixed(1)}h of studying across ${totalSessions} sessions. Habit compliance ended with a consistency score of ${consistencyScore}%.`;

  // ── 5-Day Workweek Aggregations (Canonical Work Time) ─────────────────────
  const { getWorkTimeBetweenDates } = await import("@/lib/repositories/workTimeDaily");
  const weeklyWorkTimeMap = await getWorkTimeBetweenDates(startStr, endStr);

  const dailyDistribution = [];
  for (let i = 0; i < 7; i++) {
    const curDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = formatDateInTimezone(curDate, timezone);
    const dayOfWeek = getDayOfWeekName(dateStr);
    const isWknd = isWeekend(dateStr, timezone);

    const canonicalSeconds = weeklyWorkTimeMap[dateStr] || 0;
    const canonicalHours = Math.round((canonicalSeconds / 3600) * 100) / 100;

    const dayHuntHours = 0;
    const dayLearnHours = 0;
    const dayProdHours = canonicalHours;

    dailyDistribution.push({
      date: dateStr,
      dayOfWeek,
      isWeekend: isWknd,
      learningHours: Math.round(dayLearnHours * 100) / 100,
      huntingHours: Math.round(dayHuntHours * 100) / 100,
      productiveHours: dayProdHours,
      metTarget: dayProdHours >= DAILY_IDEAL_HOURS,
    });
  }

  const totalProductiveHours = Math.round(
    dailyDistribution.reduce((acc, d) => acc + d.productiveHours, 0) * 100
  ) / 100;
  const productiveDaysCount = dailyDistribution.filter((d) => d.productiveHours > 0).length;
  const weekdayTotalHours = dailyDistribution
    .filter((d) => !d.isWeekend)
    .reduce((acc, d) => acc + d.productiveHours, 0);
  const averageWorkdayHours = Math.round((weekdayTotalHours / 5) * 100) / 100;
  const completionPercentage = Math.round((totalProductiveHours / WEEKLY_TARGET_HOURS) * 1000) / 10;
  const surplusDeficitHours = Math.round((totalProductiveHours - WEEKLY_TARGET_HOURS) * 100) / 100;

  const sortedDays = [...dailyDistribution].sort((a, b) => b.productiveHours - a.productiveHours);
  const strongestDay = sortedDays[0]?.productiveHours > 0
    ? { date: sortedDays[0].date, dayOfWeek: sortedDays[0].dayOfWeek, hours: sortedDays[0].productiveHours }
    : null;
  const workdaysOnly = dailyDistribution.filter((d) => !d.isWeekend);
  const sortedWorkdays = [...workdaysOnly].sort((a, b) => a.productiveHours - b.productiveHours);
  const weakestDay = sortedWorkdays[0]
    ? { date: sortedWorkdays[0].date, dayOfWeek: sortedWorkdays[0].dayOfWeek, hours: sortedWorkdays[0].productiveHours }
    : null;
  const daysReaching8hCount = dailyDistribution.filter((d) => d.productiveHours >= DAILY_IDEAL_HOURS).length;
  const daysBelowTargetCount = workdaysOnly.filter((d) => d.productiveHours < DAILY_IDEAL_HOURS).length;
  const classification: "GREEN" | "YELLOW" | "RED" =
    averageWorkdayHours >= DAILY_IDEAL_HOURS ? "GREEN" : averageWorkdayHours >= 6.0 ? "YELLOW" : "RED";

  const recoveryRequired = totalProductiveHours < WEEKLY_TARGET_HOURS;
  const unrecoveredHours = Math.max(0, WEEKLY_TARGET_HOURS - totalProductiveHours);
  const weekdayRemainingDeficit = Math.max(0, WEEKLY_TARGET_HOURS - weekdayTotalHours);
  const requiredRecoveryPace = recoveryRequired ? Math.round((unrecoveredHours / 2) * 100) / 100 : 0;
  const saturdayRecoveryStatus: "NORMAL_HOLIDAY" | "RECOVERY_WORKDAY" =
    weekdayRemainingDeficit > 0 ? "RECOVERY_WORKDAY" : "NORMAL_HOLIDAY";
  const sundayRecoveryStatus: "NORMAL_HOLIDAY" | "RECOVERY_WORKDAY" =
    weekdayRemainingDeficit > REALISTIC_MAX_DAILY_SESSION_HOURS ? "RECOVERY_WORKDAY" : "NORMAL_HOLIDAY";
  const maxDailyPaceReached = Math.round(Math.max(0, ...dailyDistribution.map((d) => d.productiveHours)) * 100) / 100;
  const ceilingApproachedOrExceeded = maxDailyPaceReached >= 9.5;

  // Compile final report payload
  const report: WeeklyReviewReport = {
    year,
    weekNumber: week,
    startDate: startStr,
    endDate: endStr,
    executiveSummary: {
      consistencyState,
      consistencyScore,
      consistencyTrendText,
      summaryText,
    },
    workSummary: {
      totalHuntingHours: Math.round(totalHuntingHours * 10) / 10,
      totalLearningHours: Math.round(totalLearningHours * 10) / 10,
      totalSessions,
      targetsCount: targetsWorkedOn.length,
      topicsCount: topicsStudied.length,
      reportsSubmitted,
      validReports,
      targetsWorkedOn,
      topicsStudied,
    },
    comparison,
    topTargetsRanked: topTargetsRanked.slice(0, 5),
    topLearningRanked: topLearningRanked.slice(0, 5),
    discoveries: discoveries.slice(0, 5),
    habitReview,
    achievements: achievements.slice(0, 5),
    recommendations: recommendations.slice(0, 5),
    nextWeekSnapshot,
    work: {
      totalProductiveHours,
      learningHours: Math.round(totalLearningHours * 100) / 100,
      huntingHours: Math.round(totalHuntingHours * 100) / 100,
      productiveDaysCount,
      averageWorkdayHours,
      dailyTargetHours: DAILY_IDEAL_HOURS,
      weeklyTargetHours: WEEKLY_TARGET_HOURS,
      completionPercentage,
      surplusDeficitHours,
    },
    performance: {
      dailyDistribution,
      strongestDay,
      weakestDay,
      daysReaching8hCount,
      daysBelowTargetCount,
      classification,
    },
    recovery: {
      recoveryRequired,
      requiredRecoveryPace,
      saturdayRecoveryStatus,
      sundayRecoveryStatus,
      maxDailyPaceReached,
      ceilingApproachedOrExceeded,
    },
    cybersecurityOutput: {
      reconSessionsCount: 0,
      reconHours: 0,
      targetsWorkedCount: 0,
      targetsWorked: [],
      findingsCount: 0,
      validFindingsCount: 0,
      submittedFindingsCount: 0,
      reportsSubmitted: 0,
      validReports: 0,
    },
  };

  // Save review in cache
  await saveWeeklyReview(year, week, startStr, endStr, JSON.stringify(report));

  return report;
}
