import { 
  formatDateInTimezone, 
  calculateConsistencyForPeriod 
} from "@/lib/services/consistency";
import { getAllDailyEntries } from "@/lib/repositories/dailyEntries";
import { getAllSessions } from "@/lib/repositories/targetSessions";
import { getAllLearningSessions } from "@/lib/repositories/learning";
import { getAllFindings } from "@/lib/repositories/targetFindings";
import { getAllTargets } from "@/lib/repositories/targets";
import { getAllActivities } from "@/lib/repositories/activities";
import { getCorrelationDiagnostics } from "@/lib/services/correlationEngine";
import { saveWeeklyReview } from "@/lib/repositories/weeklyReview";

export type ComparisonMetric = {
  thisWeekValue: number;
  prevWeekValue: number;
  prevWeekDiffPercent: number;
  avg30dValue: number;
  avg30dDiffPercent: number;
};

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
  avgSleepHours: number;
  avgSleepHoursDiffPrev: number;
  avgSleepHoursDiff30d: number;
  avgBedTime: string;
  avgWakeTime: string;
  avgMobileScreenTime: number;
  avgMobileScreenTimeDiffPrev: number;
  avgMobileScreenTimeDiff30d: number;
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
};

export function getISOWeekUTC(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = d.getTime();
  d.setUTCMonth(0, 1);
  if (d.getUTCDay() !== 4) {
    d.setUTCMonth(0, 1 + ((4 - d.getUTCDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - d.getTime()) / 604800000);
}

export function getISOWeekYearUTC(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  return d.getUTCFullYear();
}

function getUtcDateForLocalTime(dateStr: string, timezone: string): Date {
  const parts = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.(\d{3}))?$/);
  if (!parts) return new Date(dateStr);
  
  const y = parseInt(parts[1], 10);
  const m = parseInt(parts[2], 10) - 1;
  const d = parseInt(parts[3], 10);
  const hr = parseInt(parts[4], 10);
  const min = parseInt(parts[5], 10);
  const sec = parseInt(parts[6], 10);
  const ms = parts[8] ? parseInt(parts[8], 10) : 0;
  
  let utcTime = Date.UTC(y, m, d, hr, min, sec, ms);
  let testDate = new Date(utcTime);
  
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  
  for (let iter = 0; iter < 3; iter++) {
    const formattedParts = formatter.formatToParts(testDate);
    const fy = parseInt(formattedParts.find(p => p.type === "year")!.value, 10);
    const fm = parseInt(formattedParts.find(p => p.type === "month")!.value, 10) - 1;
    const fd = parseInt(formattedParts.find(p => p.type === "day")!.value, 10);
    const fhr = parseInt(formattedParts.find(p => p.type === "hour")!.value, 10);
    const fmin = parseInt(formattedParts.find(p => p.type === "minute")!.value, 10);
    const fsec = parseInt(formattedParts.find(p => p.type === "second")!.value, 10);
    
    const formattedUtc = Date.UTC(fy, fm, fd, fhr, fmin, fsec, ms);
    const diff = utcTime - formattedUtc;
    if (diff === 0) break;
    utcTime += diff;
    testDate = new Date(utcTime);
  }
  
  return testDate;
}

export function getDatesForWeek(year: number, week: number, timezone = "UTC") {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const mondayOfW1 = new Date(jan4.getTime() + diffToMonday * 24 * 60 * 60 * 1000);
  
  const monday = new Date(mondayOfW1.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
  
  const startStr = monday.toISOString().split("T")[0];
  const endStr = sunday.toISOString().split("T")[0];
  
  const start = getUtcDateForLocalTime(`${startStr}T00:00:00`, timezone);
  const end = getUtcDateForLocalTime(`${endStr}T23:59:59.999`, timezone);
  
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getTime() + i * 24 * 60 * 60 * 1000);
    dates.push(d.toISOString().split("T")[0]);
  }

  return { start, end, startStr, endStr, dates };
}

function parseTimeToMinutes(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const match = timeStr.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
  if (!match) return null;
  const [, h, m] = match;
  return Number(h) * 60 + Number(m);
}

function formatMinutesToTime(totalMin: number): string {
  const h = Math.floor(totalMin / 60) % 24;
  const m = Math.round(totalMin % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function calculateSleepForEntry(bedTimeStr?: string | null, wakeTimeStr?: string | null): number | null {
  const bedMin = parseTimeToMinutes(bedTimeStr);
  const wakeMin = parseTimeToMinutes(wakeTimeStr);
  if (bedMin === null || wakeMin === null) return null;
  return bedMin > wakeMin ? (wakeMin + 1440 - bedMin) / 60 : (wakeMin - bedMin) / 60;
}

function averageTimeOfStatus(times: string[]): string {
  const parsed = times.map(parseTimeToMinutes).filter((t): t is number => t !== null);
  if (parsed.length === 0) return "N/A";
  
  let sumRelative = 0;
  for (const min of parsed) {
    const rel = min >= 720 ? min - 1440 : min;
    sumRelative += rel;
  }
  
  const avgRel = sumRelative / parsed.length;
  const finalMin = avgRel < 0 ? avgRel + 1440 : avgRel;
  return formatMinutesToTime(finalMin);
}

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

export async function generateWeeklyReviewReport(year: number, week: number, timezone = "UTC"): Promise<WeeklyReviewReport> {
  const { start, end, startStr, endStr } = getDatesForWeek(year, week, timezone);
  
  // Calculate previous week boundaries
  let prevWeek = week - 1;
  let prevYear = year;
  if (prevWeek === 0) {
    prevYear = year - 1;
    const dec28 = new Date(Date.UTC(prevYear, 11, 28));
    prevWeek = getISOWeekUTC(dec28);
  }
  const { start: prevStart, end: prevEnd, startStr: prevStartStr, endStr: prevEndStr } = getDatesForWeek(prevYear, prevWeek, timezone);

  const start30d = new Date(start.getTime() - 30 * 24 * 60 * 60 * 1000);
  const end30d = new Date(start.getTime() - 1 * 24 * 60 * 60 * 1000);
  const start30dStr = formatDateInTimezone(start30d, timezone);
  const end30dStr = formatDateInTimezone(end30d, timezone);

  // 1. Fetch data
  const [
    allEntries,
    allTargetSessions,
    allLearningSessions,
    allFindings,
    allTargets,
    allActivities
  ] = await Promise.all([
    getAllDailyEntries(),
    getAllSessions(),
    getAllLearningSessions(),
    getAllFindings(),
    getAllTargets(),
    getAllActivities()
  ]);

  // 2. Filter this week data
  const thisWeekEntries = allEntries.filter(e => e.date >= startStr && e.date <= endStr);
  const thisWeekTargetSessions = allTargetSessions.filter(s => {
    if (!s.started_at) return false;
    const localDateStr = formatDateInTimezone(new Date(s.started_at), timezone);
    return localDateStr >= startStr && localDateStr <= endStr;
  });
  const thisWeekLearningSessions = allLearningSessions.filter(s => {
    if (!s.started_at) return false;
    const localDateStr = formatDateInTimezone(new Date(s.started_at), timezone);
    return localDateStr >= startStr && localDateStr <= endStr;
  });
  const thisWeekFindings = allFindings.filter(f => {
    if (!f.submitted_at) return false;
    const localDateStr = formatDateInTimezone(new Date(f.submitted_at), timezone);
    return localDateStr >= startStr && localDateStr <= endStr;
  });

  // 3. Filter previous week data
  const prevWeekEntries = allEntries.filter(e => e.date >= prevStartStr && e.date <= prevEndStr);
  const prevWeekTargetSessions = allTargetSessions.filter(s => {
    if (!s.started_at) return false;
    const localDateStr = formatDateInTimezone(new Date(s.started_at), timezone);
    return localDateStr >= prevStartStr && localDateStr <= prevEndStr;
  });
  const prevWeekLearningSessions = allLearningSessions.filter(s => {
    if (!s.started_at) return false;
    const localDateStr = formatDateInTimezone(new Date(s.started_at), timezone);
    return localDateStr >= prevStartStr && localDateStr <= prevEndStr;
  });
  const prevWeekFindings = allFindings.filter(f => {
    if (!f.submitted_at) return false;
    const localDateStr = formatDateInTimezone(new Date(f.submitted_at), timezone);
    return localDateStr >= prevStartStr && localDateStr <= prevEndStr;
  });

  // 4. Filter 30-day baseline data
  const entries30d = allEntries.filter(e => e.date >= start30dStr && e.date <= end30dStr);
  const targetSessions30d = allTargetSessions.filter(s => {
    if (!s.started_at) return false;
    const localDateStr = formatDateInTimezone(new Date(s.started_at), timezone);
    return localDateStr >= start30dStr && localDateStr <= end30dStr;
  });
  const learningSessions30d = allLearningSessions.filter(s => {
    if (!s.started_at) return false;
    const localDateStr = formatDateInTimezone(new Date(s.started_at), timezone);
    return localDateStr >= start30dStr && localDateStr <= end30dStr;
  });
  const findings30d = allFindings.filter(f => {
    if (!f.submitted_at) return false;
    const localDateStr = formatDateInTimezone(new Date(f.submitted_at), timezone);
    return localDateStr >= start30dStr && localDateStr <= end30dStr;
  });

  // ================= SECTION 2: WORK SUMMARY =================
  const totalHuntingHours = thisWeekTargetSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60;
  const totalLearningHours = thisWeekLearningSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60;
  const totalSessions = thisWeekTargetSessions.length + thisWeekLearningSessions.length;
  
  const targetsSet = new Set(thisWeekTargetSessions.map(s => s.target));
  const topicsSet = new Set(thisWeekLearningSessions.map(s => s.topicName));
  const targetsWorkedOn = Array.from(targetsSet).filter(Boolean) as string[];
  const topicsStudied = Array.from(topicsSet).filter(Boolean) as string[];
  
  const reportsSubmitted = thisWeekFindings.length;
  const validReports = thisWeekFindings.filter(f => f.status === "Valid").length;

  const consistencyScore = calculateConsistencyForWeek(start, timezone, allEntries, allTargetSessions, allLearningSessions, allActivities, allFindings);

  // ================= PREVIOUS WEEK VALUES =================
  const prevHuntingHours = prevWeekTargetSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60;
  const prevLearningHours = prevWeekLearningSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60;
  const prevReportsSubmitted = prevWeekFindings.length;
  const prevValidReports = prevWeekFindings.filter(f => f.status === "Valid").length;
  const prevConsistency = calculateConsistencyForWeek(prevStart, timezone, allEntries, allTargetSessions, allLearningSessions, allActivities, allFindings);

  // ================= 30-DAY AVERAGE BASELINE (SCALED WEEKLY) =================
  const huntingHours30d = targetSessions30d.reduce((acc, s) => acc + (s.duration || 0), 0) / 60;
  const learningHours30d = learningSessions30d.reduce((acc, s) => acc + (s.duration || 0), 0) / 60;
  const reports30d = findings30d.length;
  const valid30d = findings30d.filter(f => f.status === "Valid").length;

  const avgHuntingHoursWeekly30d = (huntingHours30d / 30) * 7;
  const avgLearningHoursWeekly30d = (learningHours30d / 30) * 7;
  const avgReportsWeekly30d = (reports30d / 30) * 7;
  const avgValidWeekly30d = (valid30d / 30) * 7;

  let sumDailyConsistency30d = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(start30d.getTime() + i * 24 * 60 * 60 * 1000);
    const score = calculateConsistencyForWeek(d, timezone, allEntries, allTargetSessions, allLearningSessions, allActivities, allFindings);
    sumDailyConsistency30d += score;
  }
  const avgConsistency30d = Math.round(sumDailyConsistency30d / 30);

  // Helper function to build ComparisonMetric
  const buildMetric = (thisVal: number, prevVal: number, avg30dVal: number): ComparisonMetric => {
    const prevWeekDiffPercent = prevVal === 0 
      ? (thisVal > 0 ? 100 : 0) 
      : Math.round(((thisVal - prevVal) / prevVal) * 100);
    
    const avg30dDiffPercent = avg30dVal === 0
      ? (thisVal > 0 ? 100 : 0)
      : Math.round(((thisVal - avg30dVal) / avg30dVal) * 100);

    return {
      thisWeekValue: Math.round(thisVal * 10) / 10,
      prevWeekValue: Math.round(prevVal * 10) / 10,
      prevWeekDiffPercent,
      avg30dValue: Math.round(avg30dVal * 10) / 10,
      avg30dDiffPercent,
    };
  };

  // ================= SECTION 3: COMPARISON =================
  const comparison = {
    huntingHours: buildMetric(totalHuntingHours, prevHuntingHours, avgHuntingHoursWeekly30d),
    learningHours: buildMetric(totalLearningHours, prevLearningHours, avgLearningHoursWeekly30d),
    consistency: {
      thisWeekValue: consistencyScore,
      prevWeekValue: prevConsistency,
      prevWeekDiffPercent: consistencyScore - prevConsistency, // show raw difference for scores
      avg30dValue: avgConsistency30d,
      avg30dDiffPercent: consistencyScore - avgConsistency30d,
    },
    reportsSubmitted: buildMetric(reportsSubmitted, prevReportsSubmitted, avgReportsWeekly30d),
    validReports: buildMetric(validReports, prevValidReports, avgValidWeekly30d),
  };

  // ================= SECTION 4: TOP TARGETS =================
  const targetsRankedMap: Record<string, { name: string; hours: number; reports: number; valid: number }> = {};
  
  thisWeekTargetSessions.forEach(s => {
    if (!s.target) return;
    if (!targetsRankedMap[s.target]) {
      targetsRankedMap[s.target] = { name: s.target, hours: 0, reports: 0, valid: 0 };
    }
    targetsRankedMap[s.target].hours += (s.duration || 0) / 60;
  });

  thisWeekFindings.forEach(f => {
    const targetName = allTargets.find(t => t.id === f.target_id)?.name;
    if (!targetName) return;
    if (!targetsRankedMap[targetName]) {
      targetsRankedMap[targetName] = { name: targetName, hours: 0, reports: 0, valid: 0 };
    }
    targetsRankedMap[targetName].reports += 1;
    if (f.status === "Valid") {
      targetsRankedMap[targetName].valid += 1;
    }
  });

  const topTargetsRanked: TargetRanking[] = Object.values(targetsRankedMap)
    .map(t => ({
      name: t.name,
      hours: Math.round(t.hours * 10) / 10,
      reportsSubmitted: t.reports,
      validReports: t.valid,
      hoursPerValidReport: t.valid === 0 ? "N/A" : Math.round((t.hours / t.valid) * 10) / 10,
    }))
    .sort((a, b) => b.hours - a.hours);

  // ================= SECTION 5: TOP LEARNING =================
  const learningRankedMap: Record<string, { name: string; hours: number; sessions: number; latest: string }> = {};

  thisWeekLearningSessions.forEach(s => {
    if (!s.topicName) return;
    if (!learningRankedMap[s.topicName]) {
      learningRankedMap[s.topicName] = { name: s.topicName, hours: 0, sessions: 0, latest: "" };
    }
    learningRankedMap[s.topicName].hours += (s.duration || 0) / 60;
    learningRankedMap[s.topicName].sessions += 1;
    if (s.started_at && s.started_at > learningRankedMap[s.topicName].latest) {
      learningRankedMap[s.topicName].latest = s.started_at;
    }
  });

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const topLearningRanked: TopicRanking[] = Object.values(learningRankedMap)
    .map(t => {
      let friendlyLastStudied = "N/A";
      if (t.latest) {
        const lastDate = new Date(t.latest);
        friendlyLastStudied = dayNames[lastDate.getUTCDay()];
      }
      return {
        name: t.name,
        hours: Math.round(t.hours * 10) / 10,
        sessions: t.sessions,
        lastStudied: friendlyLastStudied,
      };
    })
    .sort((a, b) => b.hours - a.hours);

  // ================= SECTION 7: HABIT REVIEW =================
  const readingDays = thisWeekEntries.filter(e => e.reading === 1).length;
  const prevReadingDays = prevWeekEntries.filter(e => e.reading === 1).length;
  const avgReadingDays30d = (entries30d.filter(e => e.reading === 1).length / 30) * 7;

  const workoutCount = thisWeekEntries.filter(e => e.workout === 1).length;
  const prevWorkoutCount = prevWeekEntries.filter(e => e.workout === 1).length;
  const avgWorkoutCount30d = (entries30d.filter(e => e.workout === 1).length / 30) * 7;

  // Sleep hours averages
  const getSleepForEntries = (entries: any[]) => {
    const hours = entries
      .map(e => calculateSleepForEntry(e.bed_time, e.wake_time))
      .filter((h): h is number => h !== null);
    if (hours.length === 0) return 0;
    return hours.reduce((sum, h) => sum + h, 0) / hours.length;
  };

  const avgSleepHours = getSleepForEntries(thisWeekEntries);
  const prevAvgSleepHours = getSleepForEntries(prevWeekEntries);
  const avgSleepHours30d = getSleepForEntries(entries30d);

  // Average bed and wake times
  const bedTimes = thisWeekEntries.map(e => e.bed_time).filter(Boolean) as string[];
  const wakeTimes = thisWeekEntries.map(e => e.wake_time).filter(Boolean) as string[];

  const avgBedTime = averageTimeOfStatus(bedTimes);
  const avgWakeTime = averageTimeOfStatus(wakeTimes);

  // Mobile Screen Time averages
  const getScreenTimeForEntries = (entries: any[]) => {
    const times = entries
      .map(e => e.mobile_screen_time)
      .filter((t): t is number => t !== null && t !== undefined);
    if (times.length === 0) return 0;
    return times.reduce((sum, t) => sum + t, 0) / times.length;
  };

  const avgMobileScreenTime = getScreenTimeForEntries(thisWeekEntries);
  const prevAvgMobileScreenTime = getScreenTimeForEntries(prevWeekEntries);
  const avgMobileScreenTime30d = getScreenTimeForEntries(entries30d);

  // Completion rates
  const getCompletionRate = (entries: any[]) => {
    if (entries.length === 0) return 0;
    let completed = 0;
    let total = 0;
    entries.forEach(e => {
      const bSet = e.bed_time ? 1 : 0;
      const wSet = e.wake_time ? 1 : 0;
      const woSet = e.workout ? 1 : 0;
      const rSet = e.reading ? 1 : 0;
      const scrSet = e.mobile_screen_time !== null && e.mobile_screen_time !== undefined && e.mobile_screen_time > 0 ? 1 : 0;
      const lSet = e.notes && e.notes.trim() !== "" ? 1 : 0;
      completed += bSet + wSet + woSet + rSet + scrSet + lSet;
      total += 6;
    });
    return Math.round((completed / total) * 100);
  };

  const completionRate = getCompletionRate(thisWeekEntries);

  const habitReview: HabitReviewDetail = {
    readingDays,
    readingDaysDiffPrev: readingDays - prevReadingDays,
    readingDaysDiff30d: Math.round((readingDays - avgReadingDays30d) * 10) / 10,
    workoutCount,
    workoutCountDiffPrev: workoutCount - prevWorkoutCount,
    workoutCountDiff30d: Math.round((workoutCount - avgWorkoutCount30d) * 10) / 10,
    avgSleepHours: Math.round(avgSleepHours * 10) / 10,
    avgSleepHoursDiffPrev: Math.round((avgSleepHours - prevAvgSleepHours) * 10) / 10,
    avgSleepHoursDiff30d: Math.round((avgSleepHours - avgSleepHours30d) * 10) / 10,
    avgBedTime,
    avgWakeTime,
    avgMobileScreenTime: Math.round(avgMobileScreenTime),
    avgMobileScreenTimeDiffPrev: Math.round(avgMobileScreenTime - prevAvgMobileScreenTime),
    avgMobileScreenTimeDiff30d: Math.round(avgMobileScreenTime - avgMobileScreenTime30d),
    completionRate,
    consistencyScore,
  };

  // ================= SECTION 6: DISCOVERIES =================
  const diagnostics = await getCorrelationDiagnostics();
  const discoveries: { text: string; confidence: "High" | "Medium" | "Low" }[] = [];
  const recommendations: string[] = [];

  if (diagnostics.insights.sleep?.status === "success") {
    const sleep = diagnostics.insights.sleep;
    if (sleep.impact > 0) {
      discoveries.push({
        text: `Optimal sleep (7-8h) increased average daily hunting by ${sleep.impact.toFixed(1)}h compared to short sleep days (<6h).`,
        confidence: sleep.confidence || "Low",
      });
      recommendations.push("Maintain a 7-8 hour sleep schedule to optimize next-day focus and session duration.");
    }
  }

  if (diagnostics.insights.reading?.status === "success") {
    const reading = diagnostics.insights.reading;
    if (reading.reading && reading.nonReading) {
      const diff = reading.reading.avgSessionLength - reading.nonReading.avgSessionLength;
      if (diff > 0) {
        discoveries.push({
          text: `Reading days averaged ${(diff * 60).toFixed(0)} minutes longer hunting sessions compared to non-reading days.`,
          confidence: reading.confidence || "Low",
        });
        recommendations.push("Increase reading frequency before starting operations to extend session capacity.");
      }
    }
  }

  if (diagnostics.insights.workout?.status === "success") {
    const workout = diagnostics.insights.workout;
    if (workout.workout && workout.noWorkout) {
      const diff = workout.workout.avgConsistency - workout.noWorkout.avgConsistency;
      if (Math.abs(diff) < 5) {
        discoveries.push({
          text: "Workouts show no measurable relationship to total daily productivity.",
          confidence: workout.confidence || "Low",
        });
        recommendations.push("Continue workouts to maintain health, though direct productivity links are minor.");
      } else if (diff > 0) {
        discoveries.push({
          text: `Workout days correlated with a ${diff.toFixed(0)}% increase in habit completion consistency.`,
          confidence: workout.confidence || "Low",
        });
        recommendations.push("Maintain workout schedules to keep structural habit enforcement high.");
      }
    }
  }

  if (diagnostics.insights.bedTime?.status === "success") {
    const bed = diagnostics.insights.bedTime;
    const hours = [
      { label: "before 11 PM", val: bed.avgHuntingBefore11 },
      { label: "between 11 PM-12 AM", val: bed.avgHunting11to12 },
      { label: "after Midnight", val: bed.avgHuntingAfterMidnight },
    ].sort((a, b) => b.val - a.val);
    
    if (hours[0].val > 0) {
      discoveries.push({
        text: `Bedtimes ${hours[0].label} produced the highest average hunting hours (${hours[0].val.toFixed(1)}h).`,
        confidence: bed.confidence || "Low",
      });
      if (hours[0].label === "before 11 PM") {
        recommendations.push("Maintain current bedtime before 11 PM to capture maximum next-day productivity.");
      }
    }
  }

  if (diagnostics.insights.wakeTime?.status === "success") {
    const wake = diagnostics.insights.wakeTime;
    if (wake.earlyWake && wake.lateWake) {
      const diff = wake.earlyWake.avgHunting - wake.lateWake.avgHunting;
      if (diff > 0) {
        discoveries.push({
          text: `Early wake times (before median ${wake.medianWakeTime}) produced ${diff.toFixed(1)}h more average hunting than late wake times.`,
          confidence: wake.confidence || "Low",
        });
        recommendations.push(`Aim to wake up before ${wake.medianWakeTime} to maximize morning productivity windows.`);
      }
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

  // Target rotation recommendations
  for (const target of allTargets) {
    const targetSessionLogs = allTargetSessions.filter(s => s.target_id === target.id);
    const targetFindingLogs = allFindings.filter(f => f.target_id === target.id);
    const targetHours = targetSessionLogs.reduce((sum, s) => sum + (s.duration || 0), 0) / 60;
    
    if (targetHours >= 15 && targetFindingLogs.length === 0 && target.status !== "Completed") {
      recommendations.push(`Target '${target.name}' has received ${targetHours.toFixed(1)} hours of hunting without findings. Consider rotating targets.`);
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

  for (const session of allTargetSessions) {
    if (!session.started_at) continue;
    const localDateStr = formatDateInTimezone(new Date(session.started_at), timezone);
    const parts = localDateStr.split("-").map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    const w = getISOWeekUTC(d);
    const y = getISOWeekYearUTC(d);
    const key = `${y}-${w}`;
    if (!weeksMap[key]) {
      const { start: wkStart } = getDatesForWeek(y, w, timezone);
      weeksMap[key] = { year: y, week: w, start: wkStart, huntingHours: 0, learningHours: 0, reportsCount: 0, entries: [], sessions: [] };
    }
    weeksMap[key].huntingHours += (session.duration || 0) / 60;
    weeksMap[key].sessions.push(session);
  }

  for (const session of allLearningSessions) {
    if (!session.started_at) continue;
    const localDateStr = formatDateInTimezone(new Date(session.started_at), timezone);
    const parts = localDateStr.split("-").map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    const w = getISOWeekUTC(d);
    const y = getISOWeekYearUTC(d);
    const key = `${y}-${w}`;
    if (!weeksMap[key]) {
      const { start: wkStart } = getDatesForWeek(y, w, timezone);
      weeksMap[key] = { year: y, week: w, start: wkStart, huntingHours: 0, learningHours: 0, reportsCount: 0, entries: [], sessions: [] };
    }
    weeksMap[key].learningHours += (session.duration || 0) / 60;
    weeksMap[key].sessions.push(session);
  }

  for (const finding of allFindings) {
    if (!finding.submitted_at) continue;
    const localDateStr = formatDateInTimezone(new Date(finding.submitted_at), timezone);
    const parts = localDateStr.split("-").map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    const w = getISOWeekUTC(d);
    const y = getISOWeekYearUTC(d);
    const key = `${y}-${w}`;
    if (!weeksMap[key]) {
      const { start: wkStart } = getDatesForWeek(y, w, timezone);
      weeksMap[key] = { year: y, week: w, start: wkStart, huntingHours: 0, learningHours: 0, reportsCount: 0, entries: [], sessions: [] };
    }
    weeksMap[key].reportsCount += 1;
  }

  const weeksList = Object.values(weeksMap).map(wk => {
    const score = calculateConsistencyForWeek(wk.start, timezone, allEntries, allTargetSessions, allLearningSessions, allActivities, allFindings);
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

  if (thisWeekTargetSessions.length > 0) {
    const sortedThisWeekSessions = [...thisWeekTargetSessions].sort((a, b) => (b.duration || 0) - (a.duration || 0));
    const longestThisWeek = sortedThisWeekSessions[0];
    const longestHours = (longestThisWeek.duration || 0) / 60;
    
    const sortedAllTimeSessions = [...allTargetSessions].sort((a, b) => (b.duration || 0) - (a.duration || 0));
    const longestAllTime = sortedAllTimeSessions[0];
    const longestAllTimeHours = longestAllTime ? (longestAllTime.duration || 0) / 60 : 0;
    
    if (longestHours > 0 && longestHours >= longestAllTimeHours) {
      achievements.push(`New all-time record for longest single hunting session: ${longestHours.toFixed(1)}h on target '${longestThisWeek.target}'.`);
    } else {
      achievements.push(`Longest hunting session this week: ${longestHours.toFixed(1)}h on target '${longestThisWeek.target}'.`);
    }
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
    : `Maintain current bedtime and wake schedules to preserve high consistency score (${consistencyScore}%).`;

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
  };

  // Save review in cache
  await saveWeeklyReview(year, week, startStr, endStr, JSON.stringify(report));

  return report;
}
