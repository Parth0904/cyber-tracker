import { many } from "@/lib/database";
import { getAllDailyEntries } from "@/lib/repositories/dailyEntries";
import { getAllSessions } from "@/lib/repositories/targetSessions";
import { getAllLearningSessions, getAllTopics } from "@/lib/repositories/learning";
import { getAllFindings } from "@/lib/repositories/targetFindings";
import { getAllTargets } from "@/lib/repositories/targets";
import { calculateConsistency } from "@/lib/services/consistency";

// Helpers for Confidence rating
export function getConfidenceRating(sampleSize: number): "High" | "Medium" | "Low" {
  if (sampleSize >= 14) return "High";
  if (sampleSize >= 6) return "Medium";
  return "Low";
}

// Helper to check if a date falls within any range in a list of date ranges
function isDateInRanges(dateStr: string, ranges: { start: number; end: number }[]): boolean {
  const time = new Date(dateStr).getTime();
  return ranges.some(r => time >= r.start && time <= r.end);
}

// Helper to parse HH:MM to minutes from midnight
function parseTimeToMinutes(timeStr: string | null | undefined): number | null {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

export type CorrelationEngineResult = {
  overview: {
    totalHuntingHours: number;
    totalLearningHours: number;
    totalSessions: number;
    totalTargets: number;
    totalLearningTopics: number;
    reportsSubmitted: number;
    validReports: number;
    overallConsistency: number;
  };
  timeAllocation: {
    daily: { date: string; hunting: number; learning: number }[];
    weekly: { date: string; hunting: number; learning: number }[];
    monthly: { date: string; hunting: number; learning: number }[];
    yearly: { date: string; hunting: number; learning: number }[];
  };
  targetInvestment: {
    targetId: string;
    name: string;
    huntingHours: number;
    reportsSubmitted: number;
    validReports: number;
    hoursPerValidReport: number | null;
  }[];
  learningInvestment: {
    all: {
      topicId: string;
      name: string;
      totalHours: number;
      sessionsCount: number;
      lastStudiedAt: string | null;
    }[];
    mostStudied: any[];
    leastStudied: any[];
    recentlyLearned: any[];
  };
  habitAnalytics: {
    date: string;
    reading: number;
    workout: number;
    sleepHours: number;
    bedTimeMinutes: number;
    wakeTimeMinutes: number;
    consistency: number;
    completionPercent: number;
  }[];
  insights: {
    sleep: any;
    reading: any;
    workout: any;
    bedTime: any;
    wakeTime: any;
    learning: any;
  };
};

export async function getCorrelationDiagnostics(): Promise<CorrelationEngineResult> {
  // 1. Gather all data sources
  const dailyEntries = await getAllDailyEntries();
  const targetSessions = await getAllSessions();
  const learningSessions = await getAllLearningSessions();
  const targetFindings = await getAllFindings();
  
  // We want all targets (active & archived)
  const targets = await many<any>("SELECT * FROM targets");
  const topics = await getAllTopics();
  
  const completedTargetSessions = targetSessions.filter(s => s.ended_at !== null);
  const completedLearningSessions = learningSessions.filter(s => s.ended_at !== null);

  // --- SECTION A: Overview ---
  const totalHuntingHours = completedTargetSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60;
  const totalLearningHours = completedLearningSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60;
  const totalSessions = completedTargetSessions.length + completedLearningSessions.length;
  const totalTargets = targets.length;
  const totalLearningTopics = topics.length;
  const reportsSubmitted = targetFindings.length;
  const validReports = targetFindings.filter(f => f.status === "Valid").length;
  const overallConsistency = (await calculateConsistency()).score;

  // --- SECTION B: Time Allocation Breakdown ---
  // Daily Time Allocation (Last 30 Calendar Days)
  const daily: { date: string; hunting: number; learning: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    daily.push({ date: dateStr, hunting: 0, learning: 0 });
  }
  
  completedTargetSessions.forEach(s => {
    const dateStr = s.started_at.split("T")[0];
    const match = daily.find(d => d.date === dateStr);
    if (match) match.hunting += (s.duration || 0) / 60;
  });
  completedLearningSessions.forEach(s => {
    const dateStr = s.started_at.split("T")[0];
    const match = daily.find(d => d.date === dateStr);
    if (match) match.learning += (s.duration || 0) / 60;
  });

  // Helper for Start of Week (Monday Start)
  function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  // Weekly Allocation (Last 12 Weeks)
  const weekly: { date: string; hunting: number; learning: number }[] = [];
  const weekTracker = getStartOfWeek(new Date());
  for (let i = 11; i >= 0; i--) {
    const d = new Date(weekTracker);
    d.setDate(d.getDate() - i * 7);
    const label = `Wk of ${d.getMonth() + 1}/${d.getDate()}`;
    weekly.push({ date: label, hunting: 0, learning: 0 });
  }

  completedTargetSessions.forEach(s => {
    const sDate = new Date(s.started_at);
    const wkStart = getStartOfWeek(sDate);
    const label = `Wk of ${wkStart.getMonth() + 1}/${wkStart.getDate()}`;
    const match = weekly.find(w => w.date === label);
    if (match) match.hunting += (s.duration || 0) / 60;
  });
  completedLearningSessions.forEach(s => {
    const sDate = new Date(s.started_at);
    const wkStart = getStartOfWeek(sDate);
    const label = `Wk of ${wkStart.getMonth() + 1}/${wkStart.getDate()}`;
    const match = weekly.find(w => w.date === label);
    if (match) match.learning += (s.duration || 0) / 60;
  });

  // Monthly Allocation (Last 12 Months)
  const monthly: { date: string; hunting: number; learning: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleString("default", { month: "short", year: "numeric" });
    monthly.push({ date: label, hunting: 0, learning: 0 });
  }

  completedTargetSessions.forEach(s => {
    const sDate = new Date(s.started_at);
    const label = sDate.toLocaleString("default", { month: "short", year: "numeric" });
    const match = monthly.find(m => m.date === label);
    if (match) match.hunting += (s.duration || 0) / 60;
  });
  completedLearningSessions.forEach(s => {
    const sDate = new Date(s.started_at);
    const label = sDate.toLocaleString("default", { month: "short", year: "numeric" });
    const match = monthly.find(m => m.date === label);
    if (match) match.learning += (s.duration || 0) / 60;
  });

  // Yearly Allocation (All available years)
  const yearsSet = new Set<number>();
  yearsSet.add(new Date().getFullYear());
  completedTargetSessions.forEach(s => yearsSet.add(new Date(s.started_at).getFullYear()));
  completedLearningSessions.forEach(s => yearsSet.add(new Date(s.started_at).getFullYear()));
  const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);
  const yearly = sortedYears.map(y => ({ date: String(y), hunting: 0, learning: 0 }));

  completedTargetSessions.forEach(s => {
    const yr = new Date(s.started_at).getFullYear();
    const match = yearly.find(y => y.date === String(yr));
    if (match) match.hunting += (s.duration || 0) / 60;
  });
  completedLearningSessions.forEach(s => {
    const yr = new Date(s.started_at).getFullYear();
    const match = yearly.find(y => y.date === String(yr));
    if (match) match.learning += (s.duration || 0) / 60;
  });

  // --- SECTION C: Target Investment ranking ---
  const targetInvestment = targets.map(t => {
    const tSessions = completedTargetSessions.filter(s => s.target_id === t.id);
    const tFindings = targetFindings.filter(f => f.target_id === t.id);
    
    const hHours = tSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60;
    const reports = tFindings.length;
    const vReports = tFindings.filter(f => f.status === "Valid").length;
    const hoursPerValidReport = vReports > 0 ? hHours / vReports : null;

    return {
      targetId: String(t.id),
      name: t.name,
      huntingHours: Math.round(hHours * 10) / 10,
      reportsSubmitted: reports,
      validReports: vReports,
      hoursPerValidReport: hoursPerValidReport !== null ? Math.round(hoursPerValidReport * 10) / 10 : null,
    };
  });

  // --- SECTION D: Learning Investment ranking ---
  const allLearning = topics.map(tp => {
    const tpSessions = completedLearningSessions.filter(s => s.topic_id === tp.id);
    const hours = tpSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60;
    
    let lastStudiedAt: string | null = null;
    if (tpSessions.length > 0) {
      const sorted = [...tpSessions].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
      lastStudiedAt = sorted[0].started_at;
    }

    return {
      topicId: String(tp.id),
      name: tp.name,
      totalHours: Math.round(hours * 10) / 10,
      sessionsCount: tpSessions.length,
      lastStudiedAt,
    };
  });

  const mostStudied = [...allLearning].sort((a, b) => b.totalHours - a.totalHours);
  const leastStudied = [...allLearning].sort((a, b) => a.totalHours - b.totalHours);
  const recentlyLearned = allLearning
    .filter(tp => tp.lastStudiedAt !== null)
    .sort((a, b) => new Date(b.lastStudiedAt!).getTime() - new Date(a.lastStudiedAt!).getTime());

  // --- SECTION E: Habit Analytics Trends (Last 30 Calendar Days) ---
  const habitAnalytics: any[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    
    const entry = dailyEntries.find(e => e.date === dateStr);
    const reading = entry?.reading ? 100 : 0;
    const workout = entry?.workout ? 100 : 0;
    const sleepHours = entry?.sleep_hours ?? 0;
    const bedTimeMinutes = parseTimeToMinutes(entry?.bed_time) ?? 0;
    const wakeTimeMinutes = parseTimeToMinutes(entry?.wake_time) ?? 0;
    
    const bSet = entry?.bed_time ? 1 : 0;
    const wSet = entry?.wake_time ? 1 : 0;
    const woSet = entry?.workout ? 1 : 0;
    const rSet = entry?.reading ? 1 : 0;
    const lSet = entry?.notes && entry.notes.trim() !== "" ? 1 : 0;
    const completionPercent = ((bSet + wSet + woSet + rSet + lSet) / 5) * 100;
    
    // Calculate rolling 7-day consistency score up to this date
    let consistencyScore = 0;
    let habitSum = 0;
    let workoutSum = 0;
    let readingSum = 0;
    let loggingSum = 0;
    let sessionSum = 0;
    
    for (let offset = 6; offset >= 0; offset--) {
      const targetD = new Date(d);
      targetD.setDate(targetD.getDate() - offset);
      const targetDateStr = targetD.toISOString().split("T")[0];
      const targetEntry = dailyEntries.find(e => e.date === targetDateStr);
      
      const bS = targetEntry?.bed_time ? 1 : 0;
      const wS = targetEntry?.wake_time ? 1 : 0;
      const woS = targetEntry?.workout ? 1 : 0;
      const rS = targetEntry?.reading ? 1 : 0;
      const lS = targetEntry?.notes && targetEntry.notes.trim() !== "" ? 1 : 0;
      
      habitSum += (bS + wS + woS + rS + lS) / 5;
      workoutSum += woS;
      readingSum += rS;
      loggingSum += lS;
      
      const hasSession = targetSessions.some(s => s.started_at && s.started_at.split("T")[0] === targetDateStr);
      sessionSum += hasSession ? 1 : 0;
    }
    
    consistencyScore = Math.round(
      ((habitSum / 7) * 0.4 +
        (workoutSum / 7) * 0.15 +
        (readingSum / 7) * 0.15 +
        (loggingSum / 7) * 0.15 +
        (sessionSum / 7) * 0.15) *
        100
    );
    
    habitAnalytics.push({
      date: dateStr,
      reading,
      workout,
      sleepHours,
      bedTimeMinutes,
      wakeTimeMinutes,
      consistency: consistencyScore,
      completionPercent,
    });
  }

  // ==========================================
  // INSIGHTS ENGINE - WHY DID IT HAPPEN?
  // ==========================================

  // helper to get sum of target session durations on a specific list of dates
  const getHuntingHoursOnDates = (dates: string[]) => {
    return completedTargetSessions
      .filter(s => dates.includes(s.started_at.split("T")[0]))
      .reduce((acc, s) => acc + (s.duration || 0), 0) / 60;
  };

  const getLearningHoursOnDates = (dates: string[]) => {
    return completedLearningSessions
      .filter(s => dates.includes(s.started_at.split("T")[0]))
      .reduce((acc, s) => acc + (s.duration || 0), 0) / 60;
  };

  const getAvgSessionLengthOnDates = (dates: string[]) => {
    const matchingSessions = completedTargetSessions.filter(s => dates.includes(s.started_at.split("T")[0]));
    if (matchingSessions.length === 0) return 0;
    const totalMinutes = matchingSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    return (totalMinutes / matchingSessions.length) / 60; // in hours
  };

  const getAvgCompletionOnDates = (dates: string[]) => {
    const matchingEntries = dailyEntries.filter(e => dates.includes(e.date));
    if (matchingEntries.length === 0) return 0;
    const totalCompletion = matchingEntries.reduce((acc, entry) => {
      const bSet = entry.bed_time ? 1 : 0;
      const wSet = entry.wake_time ? 1 : 0;
      const woSet = entry.workout ? 1 : 0;
      const rSet = entry.reading ? 1 : 0;
      const lSet = entry.notes && entry.notes.trim() !== "" ? 1 : 0;
      return acc + ((bSet + wSet + woSet + rSet + lSet) / 5) * 100;
    }, 0);
    return totalCompletion / matchingEntries.length;
  };

  // 1. Sleep Insight
  // 7-8h sleep vs <6h sleep
  const sleep7_8Dates = dailyEntries.filter(e => e.sleep_hours !== null && e.sleep_hours >= 7 && e.sleep_hours <= 8).map(e => e.date);
  const sleepUnder6Dates = dailyEntries.filter(e => e.sleep_hours !== null && e.sleep_hours < 6).map(e => e.date);
  
  let sleepInsight: any = { status: "insufficient_data" };
  if (dailyEntries.length >= 5 && sleep7_8Dates.length >= 2 && sleepUnder6Dates.length >= 2) {
    const avgHunting7_8 = getHuntingHoursOnDates(sleep7_8Dates) / sleep7_8Dates.length;
    const avgHuntingUnder6 = getHuntingHoursOnDates(sleepUnder6Dates) / sleepUnder6Dates.length;
    sleepInsight = {
      status: "success",
      confidence: getConfidenceRating(sleep7_8Dates.length + sleepUnder6Dates.length),
      avgHunting7_8: Math.round(avgHunting7_8 * 10) / 10,
      avgHuntingUnder6: Math.round(avgHuntingUnder6 * 10) / 10,
      impact: Math.round((avgHunting7_8 - avgHuntingUnder6) * 10) / 10,
    };
  }

  // 2. Reading Insight
  // Reading Days vs Non-reading Days
  const readingDates = dailyEntries.filter(e => e.reading === 1).map(e => e.date);
  const nonReadingDates = dailyEntries.filter(e => e.reading === 0).map(e => e.date);

  let readingInsight: any = { status: "insufficient_data" };
  if (dailyEntries.length >= 5 && readingDates.length >= 2 && nonReadingDates.length >= 2) {
    const avgHuntingReading = getHuntingHoursOnDates(readingDates) / readingDates.length;
    const avgHuntingNonReading = getHuntingHoursOnDates(nonReadingDates) / nonReadingDates.length;
    
    const avgLearningReading = getLearningHoursOnDates(readingDates) / readingDates.length;
    const avgLearningNonReading = getLearningHoursOnDates(nonReadingDates) / nonReadingDates.length;

    const avgSessionReading = getAvgSessionLengthOnDates(readingDates);
    const avgSessionNonReading = getAvgSessionLengthOnDates(nonReadingDates);

    readingInsight = {
      status: "success",
      confidence: getConfidenceRating(readingDates.length + nonReadingDates.length),
      reading: {
        avgHunting: Math.round(avgHuntingReading * 10) / 10,
        avgLearning: Math.round(avgLearningReading * 10) / 10,
        avgSessionLength: Math.round(avgSessionReading * 10) / 10,
      },
      nonReading: {
        avgHunting: Math.round(avgHuntingNonReading * 10) / 10,
        avgLearning: Math.round(avgLearningNonReading * 10) / 10,
        avgSessionLength: Math.round(avgSessionNonReading * 10) / 10,
      },
    };
  }

  // 3. Workout Insight
  // Workout Days vs No Workout Days
  const workoutDates = dailyEntries.filter(e => e.workout === 1).map(e => e.date);
  const noWorkoutDates = dailyEntries.filter(e => e.workout === 0).map(e => e.date);

  let workoutInsight: any = { status: "insufficient_data" };
  if (dailyEntries.length >= 5 && workoutDates.length >= 2 && noWorkoutDates.length >= 2) {
    const avgHuntingWorkout = getHuntingHoursOnDates(workoutDates) / workoutDates.length;
    const avgHuntingNoWorkout = getHuntingHoursOnDates(noWorkoutDates) / noWorkoutDates.length;

    const avgLearningWorkout = getLearningHoursOnDates(workoutDates) / workoutDates.length;
    const avgLearningNoWorkout = getLearningHoursOnDates(noWorkoutDates) / noWorkoutDates.length;

    const avgConsistencyWorkout = getAvgCompletionOnDates(workoutDates);
    const avgConsistencyNoWorkout = getAvgCompletionOnDates(noWorkoutDates);

    workoutInsight = {
      status: "success",
      confidence: getConfidenceRating(workoutDates.length + noWorkoutDates.length),
      workout: {
        avgHunting: Math.round(avgHuntingWorkout * 10) / 10,
        avgLearning: Math.round(avgLearningWorkout * 10) / 10,
        avgConsistency: Math.round(avgConsistencyWorkout),
      },
      noWorkout: {
        avgHunting: Math.round(avgHuntingNoWorkout * 10) / 10,
        avgLearning: Math.round(avgLearningNoWorkout * 10) / 10,
        avgConsistency: Math.round(avgConsistencyNoWorkout),
      },
    };
  }

  // 4. Bed Time Insight
  // Before 11 PM vs 11 PM-12 AM vs After Midnight
  const bedTimeMinutesList = dailyEntries
    .map(e => ({ date: e.date, minutes: parseTimeToMinutes(e.bed_time) }))
    .filter(item => item.minutes !== null);

  const before11Dates = bedTimeMinutesList.filter(item => item.minutes! < 23 * 60).map(item => item.date);
  const between11and12Dates = bedTimeMinutesList.filter(item => item.minutes! >= 23 * 60 && item.minutes! < 24 * 60).map(item => item.date);
  const afterMidnightDates = bedTimeMinutesList.filter(item => item.minutes! >= 0 && item.minutes! < 6 * 60).map(item => item.date);

  let bedTimeInsight: any = { status: "insufficient_data" };
  // Check if at least 2 groups have at least 2 observations
  const groupsWithObservations = [before11Dates.length, between11and12Dates.length, afterMidnightDates.length].filter(len => len >= 2).length;
  if (dailyEntries.length >= 5 && groupsWithObservations >= 2) {
    const avgHuntingBefore11 = before11Dates.length > 0 ? (getHuntingHoursOnDates(before11Dates) / before11Dates.length) : 0;
    const avgHunting11to12 = between11and12Dates.length > 0 ? (getHuntingHoursOnDates(between11and12Dates) / between11and12Dates.length) : 0;
    const avgHuntingAfterMidnight = afterMidnightDates.length > 0 ? (getHuntingHoursOnDates(afterMidnightDates) / afterMidnightDates.length) : 0;

    bedTimeInsight = {
      status: "success",
      confidence: getConfidenceRating(bedTimeMinutesList.length),
      avgHuntingBefore11: Math.round(avgHuntingBefore11 * 10) / 10,
      avgHunting11to12: Math.round(avgHunting11to12 * 10) / 10,
      avgHuntingAfterMidnight: Math.round(avgHuntingAfterMidnight * 10) / 10,
    };
  }

  // 5. Wake Time Insight
  // Early Wake vs Late Wake
  const wakeTimeMinutesList = dailyEntries
    .map(e => ({ date: e.date, minutes: parseTimeToMinutes(e.wake_time) }))
    .filter(item => item.minutes !== null);

  let wakeTimeInsight: any = { status: "insufficient_data" };
  if (dailyEntries.length >= 5 && wakeTimeMinutesList.length >= 4) {
    // Find median wake time
    const sortedMinutes = [...wakeTimeMinutesList].map(i => i.minutes!).sort((a, b) => a - b);
    const mid = Math.floor(sortedMinutes.length / 2);
    const medianMinutes = sortedMinutes.length % 2 !== 0 ? sortedMinutes[mid] : (sortedMinutes[mid - 1] + sortedMinutes[mid]) / 2;

    const earlyWakeDates = wakeTimeMinutesList.filter(i => i.minutes! < medianMinutes).map(i => i.date);
    const lateWakeDates = wakeTimeMinutesList.filter(i => i.minutes! >= medianMinutes).map(i => i.date);

    if (earlyWakeDates.length >= 2 && lateWakeDates.length >= 2) {
      const avgHuntingEarly = getHuntingHoursOnDates(earlyWakeDates) / earlyWakeDates.length;
      const avgHuntingLate = getHuntingHoursOnDates(lateWakeDates) / lateWakeDates.length;

      const avgLearningEarly = getLearningHoursOnDates(earlyWakeDates) / earlyWakeDates.length;
      const avgLearningLate = getLearningHoursOnDates(lateWakeDates) / lateWakeDates.length;

      const avgConsistencyEarly = getAvgCompletionOnDates(earlyWakeDates);
      const avgConsistencyLate = getAvgCompletionOnDates(lateWakeDates);

      const medianHours = Math.floor(medianMinutes / 60);
      const medianMins = Math.round(medianMinutes % 60);
      const medianLabel = `${String(medianHours).padStart(2, "0")}:${String(medianMins).padStart(2, "0")}`;

      wakeTimeInsight = {
        status: "success",
        confidence: getConfidenceRating(wakeTimeMinutesList.length),
        medianWakeTime: medianLabel,
        earlyWake: {
          avgHunting: Math.round(avgHuntingEarly * 10) / 10,
          avgLearning: Math.round(avgLearningEarly * 10) / 10,
          avgConsistency: Math.round(avgConsistencyEarly),
        },
        lateWake: {
          avgHunting: Math.round(avgHuntingLate * 10) / 10,
          avgLearning: Math.round(avgLearningLate * 10) / 10,
          avgConsistency: Math.round(avgConsistencyLate),
        },
      };
    }
  }

  // 6. Learning Topics Attributed Outputs
  // For each learning topic, check outcomes (attributing hunting sessions and findings logged within 7 days after the study date)
  let learningInsight: any = { status: "insufficient_data" };
  const studiedTopics = topics.map(tp => {
    const tpSessions = completedLearningSessions.filter(s => s.topic_id === tp.id);
    if (tpSessions.length === 0) return null;

    // Create 7-day attribution ranges [started_at, started_at + 6 days]
    const ranges = tpSessions.map(s => {
      const start = new Date(s.started_at.split("T")[0] + "T00:00:00Z").getTime();
      const end = start + 6 * 24 * 60 * 60 * 1000 + 23 * 3600 * 1000 + 59 * 60 * 1000; // end of 7th day
      return { start, end };
    });

    // Merge overlapping ranges
    const sortedRanges = ranges.sort((a, b) => a.start - b.start);
    const mergedRanges: { start: number; end: number }[] = [];
    sortedRanges.forEach(r => {
      if (mergedRanges.length === 0) {
        mergedRanges.push(r);
      } else {
        const last = mergedRanges[mergedRanges.length - 1];
        if (r.start <= last.end) {
          last.end = Math.max(last.end, r.end);
        } else {
          mergedRanges.push(r);
        }
      }
    });

    // Calculate outcomes within merged attribution ranges
    const totalStudyHours = tpSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60;
    
    // Hunting hours in ranges
    const huntingHours = completedTargetSessions
      .filter(s => isDateInRanges(s.started_at, mergedRanges))
      .reduce((acc, s) => acc + (s.duration || 0), 0) / 60;

    // Reports submitted in ranges
    const reports = targetFindings.filter(f => isDateInRanges(f.submitted_at, mergedRanges));
    const reportsCount = reports.length;
    const validReportsCount = reports.filter(f => f.status === "Valid").length;

    return {
      topicId: String(tp.id),
      name: tp.name,
      studyHours: Math.round(totalStudyHours * 10) / 10,
      attributedHuntingHours: Math.round(huntingHours * 10) / 10,
      attributedReports: reportsCount,
      attributedValidReports: validReportsCount,
    };
  }).filter(t => t !== null) as any[];

  if (studiedTopics.length > 0) {
    learningInsight = {
      status: "success",
      confidence: getConfidenceRating(completedLearningSessions.length),
      topics: studiedTopics.sort((a, b) => b.attributedReports - a.attributedReports || b.attributedHuntingHours - a.attributedHuntingHours),
    };
  }

  return {
    overview: {
      totalHuntingHours,
      totalLearningHours,
      totalSessions,
      totalTargets,
      totalLearningTopics,
      reportsSubmitted,
      validReports,
      overallConsistency,
    },
    timeAllocation: {
      daily,
      weekly,
      monthly,
      yearly,
    },
    targetInvestment,
    learningInvestment: {
      all: allLearning,
      mostStudied,
      leastStudied,
      recentlyLearned,
    },
    habitAnalytics,
    insights: {
      sleep: sleepInsight,
      reading: readingInsight,
      workout: workoutInsight,
      bedTime: bedTimeInsight,
      wakeTime: wakeTimeInsight,
      learning: learningInsight,
    },
  };
}
