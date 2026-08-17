import { getParentReportConfig, getPendingReportLogs, getReportLog, createReportLog, updateReportLog } from "@/lib/repositories/parentReport";
import { generateWeeklyReviewReport, getDatesForWeek, getISOWeekUTC, getISOWeekYearUTC } from "@/lib/services/weeklyReview";
import { getWeeklyReview } from "@/lib/repositories/weeklyReview";
import { getAllDailyEntries } from "@/lib/repositories/dailyEntries";
import { getAllSessions } from "@/lib/repositories/targetSessions";
import { getAllLearningSessions } from "@/lib/repositories/learning";
import { getAllFindings } from "@/lib/repositories/targetFindings";
import { getAllActivities } from "@/lib/repositories/activities";
import { EmailProvider } from "./notifications/EmailProvider";
import { NotificationProvider, ParentReportData } from "./notifications/NotificationProvider";
import { formatDateInTimezone } from "@/lib/services/consistency";

export async function sendPendingReports(): Promise<void> {
  const config = await getParentReportConfig();
  if (config.enabled === 0) return;

  const pending = await getPendingReportLogs();
  if (pending.length === 0) return;

  const provider = new EmailProvider();
  const recipient = config.email_address;

  for (const log of pending) {
    try {
      const payload = await compileReportPayload(log.year, log.week_number);

      // Deliver via provider
      const dispatch = await provider.sendReport(
        config.parent_name || "Parent",
        recipient,
        payload
      );

      if (dispatch.success) {
        await updateReportLog(log.id, "Sent");
      } else {
        await updateReportLog(log.id, "Failed", dispatch.error || "Delivery failed");
      }
    } catch (err: any) {
      console.error(`Parent report compilation/dispatch error for week ${log.year}-W${log.week_number}:`, err);
      await updateReportLog(log.id, "Failed", err.message || "Unknown execution fault");
    }
  }
}

export async function checkAndQueueReport(): Promise<void> {
  const config = await getParentReportConfig();
  if (config.enabled === 0) return;

  // Resolve timezone-specific time parameters
  let weekday = "";
  let hour = 12;
  let minute = 0;
  let localDate = new Date();

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: config.time_zone || "UTC",
      weekday: "long",
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const parts = formatter.formatToParts(new Date());
    weekday = parts.find(p => p.type === "weekday")?.value || "";
    hour = Number(parts.find(p => p.type === "hour")?.value || "12");
    minute = Number(parts.find(p => p.type === "minute")?.value || "0");

    const yearVal = Number(parts.find(p => p.type === "year")?.value);
    const monthVal = Number(parts.find(p => p.type === "month")?.value) - 1; // 0-based
    const dayVal = Number(parts.find(p => p.type === "day")?.value);
    localDate = new Date(yearVal, monthVal, dayVal);
  } catch (err) {
    console.error("Timezone matching error in checkAndQueueReport:", err);
    return;
  }

  // Parse delivery target time
  const [targetHour, targetMinute] = (config.delivery_time || "20:00").split(":").map(Number);
  const currentMinutes = hour * 60 + minute;
  const targetMinutes = targetHour * 60 + targetMinute;

  let targetWeek: number;
  let targetYear: number;

  if (weekday === "Sunday") {
    if (currentMinutes >= targetMinutes) {
      // Sunday after target time: target the week ending today
      targetWeek = getISOWeekUTC(localDate);
      targetYear = getISOWeekYearUTC(localDate);
    } else {
      // Sunday before target time: target the previous week
      const prevWeekDate = new Date(localDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      targetWeek = getISOWeekUTC(prevWeekDate);
      targetYear = getISOWeekYearUTC(prevWeekDate);
    }
  } else {
    // Monday through Saturday: target the previous week
    const prevWeekDate = new Date(localDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    targetWeek = getISOWeekUTC(prevWeekDate);
    targetYear = getISOWeekYearUTC(prevWeekDate);
  }

  // Check if already queued
  const logExists = await getReportLog(targetYear, targetWeek);
  if (!logExists) {
    console.log(`Queueing Parent Weekly Report for ${targetYear} Week ${targetWeek}`);
    await createReportLog(targetYear, targetWeek);
  }

  // Dispatch reports
  await sendPendingReports();
}

async function compileReportPayload(targetYear: number, targetWeek: number): Promise<ParentReportData> {
  const config = await getParentReportConfig();
  const timezone = config.time_zone || "UTC";

  let reportData: any;
  try {
    const review = await getWeeklyReview(targetYear, targetWeek);
    if (review) {
      reportData = JSON.parse(review.report_json);
    } else {
      reportData = await generateWeeklyReviewReport(targetYear, targetWeek, timezone);
    }
  } catch (err) {
    console.error("Weekly review generation failed, compiling default fallback:", err);
    // Fallback if compilation fails
    reportData = {
      weekNumber: targetWeek,
      executiveSummary: { 
        consistencyState: "red",
        consistencyScore: 0,
      },
      workSummary: {
        totalHuntingHours: 0,
        totalLearningHours: 0,
        reportsSubmitted: 0,
        validReports: 0,
      },
      habitReview: {
        workoutCount: 0,
        workoutCountDiffPrev: 0,
        readingDays: 0,
        readingDaysDiffPrev: 0,
        avgSleepHours: 0.0,
        avgSleepHoursDiffPrev: 0.0,
        avgMobileScreenTime: 0,
        avgMobileScreenTimeDiffPrev: 0,
      },
    };
  }

  const { start, end, startStr, endStr } = getDatesForWeek(targetYear, targetWeek, timezone);

  const prevStartStr = formatDateInTimezone(new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000), timezone);
  const prevEndStr = formatDateInTimezone(new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000), timezone);

  const start30dStr = formatDateInTimezone(new Date(start.getTime() - 30 * 24 * 60 * 60 * 1000), timezone);
  const end30dStr = formatDateInTimezone(new Date(start.getTime() - 1 * 24 * 60 * 60 * 1000), timezone);

  // Fetch all raw data in parallel
  const [
    allEntries,
    allTargetSessions,
    allLearningSessions,
    allFindings,
    allActivities
  ] = await Promise.all([
    getAllDailyEntries(),
    getAllSessions(),
    getAllLearningSessions(),
    getAllFindings(),
    getAllActivities()
  ]);

  // Filter this week data
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
  const thisWeekActivities = allActivities.filter(a => a.date >= startStr && a.date <= endStr);

  // Filter 30-day baseline data for comparisons
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
  const activities30d = allActivities.filter(a => a.date >= start30dStr && a.date <= end30dStr);

  // Calculate activity counts
  const learningBlocksCompleted = thisWeekLearningSessions.length + thisWeekActivities.filter(a => a.type === "learning").length;
  const bugReportStudyBlocks = thisWeekActivities.filter(a => a.type === "bug_report").length;
  const reconSessions = thisWeekTargetSessions.filter(s => ["Recon", "Testing", "Hunting"].includes(s.type)).length + thisWeekActivities.filter(a => a.type === "recon").length;
  const targetsTested = new Set(thisWeekTargetSessions.map(s => s.target_id)).size;
  const reportsSubmitted = thisWeekFindings.length;
  const validReports = thisWeekFindings.filter(f => f.status === "Valid").length;

  // Habits
  const avgSleep = reportData.habitReview?.avgSleepHours ?? 0.0;
  const workoutDays = thisWeekEntries.filter(e => e.workout === 1).length;
  const readingBeforeBedDays = thisWeekEntries.filter(e => e.reading === 1).length;

  // Consistency and Status
  const consistencyScore = reportData.executiveSummary?.consistencyScore ?? 0;
  let overallStatusColor: "Green" | "Amber" | "Red" = "Amber";
  let overallStatus: "Excellent Week" | "Good Week" | "Needs Improvement" = "Good Week";
  let overallStatusExplanation = "";

  if (consistencyScore >= 80) {
    overallStatusColor = "Green";
    overallStatus = "Excellent Week";
    overallStatusExplanation = "Parth demonstrated highly consistent work routines and balanced them with healthy habits.";
  } else if (consistencyScore >= 50) {
    overallStatusColor = "Amber";
    overallStatus = "Good Week";
    overallStatusExplanation = "Parth maintained a steady rhythm of work, though some daily routines or habits could be more consistent.";
  } else {
    overallStatusColor = "Red";
    overallStatus = "Needs Improvement";
    overallStatusExplanation = "Parth had low activity and consistency this week; prioritizing rest and routine next week is recommended.";
  }

  // Calculate Productive Days (count out of 7)
  let productiveDaysCount = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = formatDateInTimezone(d, timezone);
    
    const hasTarget = thisWeekTargetSessions.some(s => {
      if (!s.started_at) return false;
      const localDateStr = formatDateInTimezone(new Date(s.started_at), timezone);
      return localDateStr === dateStr;
    });
    const hasLearning = thisWeekLearningSessions.some(s => {
      if (!s.started_at) return false;
      const localDateStr = formatDateInTimezone(new Date(s.started_at), timezone);
      return localDateStr === dateStr;
    });
    const hasAct = thisWeekActivities.some(a => a.date === dateStr && ["learning", "bug_report", "recon", "target", "finding"].includes(a.type));
    const hasFind = thisWeekFindings.some(f => {
      if (!f.submitted_at) return false;
      const localDateStr = formatDateInTimezone(new Date(f.submitted_at), timezone);
      return localDateStr === dateStr;
    });
    
    if (hasTarget || hasLearning || hasAct || hasFind) {
      productiveDaysCount++;
    }
  }

  // PROGRESS SUMMARY SENTENCES GENERATION
  let routineSentence = "";
  if (consistencyScore >= 80) {
    routineSentence = "Parth maintained an excellent, highly structured daily work and study routine.";
  } else if (consistencyScore >= 50) {
    routineSentence = "Parth established a steady work routine this week with decent consistency.";
  } else {
    routineSentence = "Parth's work routine was less consistent this week compared to his usual schedule.";
  }

  const totalSessions = learningBlocksCompleted + reconSessions + bugReportStudyBlocks + reportsSubmitted;
  const learning30d = learningSessions30d.length + activities30d.filter(a => a.type === "learning").length;
  const recon30d = targetSessions30d.filter(s => ["Recon", "Testing", "Hunting"].includes(s.type)).length + activities30d.filter(a => a.type === "recon").length;
  const study30d = activities30d.filter(a => a.type === "bug_report").length;
  const reports30dCount = findings30d.length;
  const totalSessions30d = learning30d + recon30d + study30d + reports30dCount;
  const avgSessionsWeekly30d = (totalSessions30d / 30) * 7;

  let activitySentence = "";
  if (totalSessions >= avgSessionsWeekly30d * 1.1) {
    activitySentence = "He increased his total learning and research sessions, demonstrating measurable progress and higher output than his recent average.";
  } else if (totalSessions <= avgSessionsWeekly30d * 0.9 && totalSessions > 0) {
    activitySentence = "He logged fewer learning and research sessions this week than his recent historical average, indicating a slower pace.";
  } else if (totalSessions === 0) {
    activitySentence = "He did not log any learning or research sessions this week.";
  } else {
    activitySentence = "His overall learning and research sessions remained stable, aligning closely with his recent averages.";
  }

  let habitsSentence = "";
  const hasSleepData = thisWeekEntries.some(e => e.sleep_hours !== null && e.sleep_hours !== undefined && e.sleep_hours > 0);
  const hasWorkoutData = thisWeekEntries.some(e => e.workout !== null && e.workout !== undefined);
  const hasReadingData = thisWeekEntries.some(e => e.reading !== null && e.reading !== undefined);

  if (!hasSleepData && !hasWorkoutData && !hasReadingData) {
    habitsSentence = "Health and recovery telemetry was not sufficiently logged this week.";
  } else if (avgSleep >= 7.0 && workoutDays >= 3) {
    habitsSentence = "He effectively balanced his work efforts with healthy recovery habits, maintaining good sleep duration and regular exercise.";
  } else if (avgSleep < 6.5 && avgSleep > 0) {
    habitsSentence = "However, his average sleep was below the recommended range, which may have impacted his daytime focus.";
  } else {
    habitsSentence = "He maintained solid basic health habits, matching his typical sleep and exercise patterns.";
  }

  let submissionsSentence = "";
  if (reportsSubmitted > 0) {
    if (validReports > 0) {
      submissionsSentence = `He successfully submitted new security reports, with ${validReports} already verified as accepted progress.`;
    } else {
      submissionsSentence = `He submitted ${reportsSubmitted} new security reports that are currently under review.`;
    }
  } else {
    submissionsSentence = "While no new security reports were submitted this week, he focused on building his evaluation and learning routines.";
  }

  const progressSummary = [routineSentence, activitySentence, habitsSentence, submissionsSentence].join(" ");

  // BIGGEST ACHIEVEMENT SELECTION
  let biggestAchievement = "Successfully completed another week of structured learning and habit tracking.";
  const prevConsistency = reportData.comparison?.consistency?.prevWeekValue ?? 0;
  const reports30d = findings30d.length;

  if (reportsSubmitted > 0 && reports30d === 0) {
    biggestAchievement = `Submitted his first security report in over a month!`;
  } else if (validReports > 0 && thisWeekFindings.every(f => ["Valid", "Submitted", "Triaged"].includes(f.status))) {
    biggestAchievement = `Achieved a 100% acceptance rate on security reports submitted this week.`;
  } else if (consistencyScore > prevConsistency && consistencyScore >= 85) {
    biggestAchievement = `Reached an exceptional weekly consistency score of ${consistencyScore}%.`;
  } else if (workoutDays >= 4) {
    biggestAchievement = `Maintained great physical health by completing ${workoutDays} workouts this week.`;
  } else if (avgSleep >= 7.5) {
    biggestAchievement = `Prioritized physical recovery, averaging ${avgSleep.toFixed(1)} hours of sleep per night.`;
  } else if (learningBlocksCompleted >= 4) {
    biggestAchievement = `Logged a strong study week, completing ${learningBlocksCompleted} learning sessions.`;
  } else if (targetsTested >= 3) {
    biggestAchievement = `Expanded his research routine by evaluating ${targetsTested} separate systems.`;
  }

  // FOCUS FOR NEXT WEEK SELECTION
  let focusNextWeek = "Maintain the current excellent balance between learning, evaluation, and habits.";
  const avgCoreRecoveryRate = thisWeekEntries.reduce((acc, e) => {
    const sleepSet = e.bed_time ? 1 : 0;
    const wakeTimeSet = e.wake_time ? 1 : 0;
    const readingSet = e.reading ? 1 : 0;
    const noScreenSet = (e.mobile_screen_time !== null && e.mobile_screen_time !== undefined) ? 1 : 0;
    return acc + (sleepSet + wakeTimeSet + readingSet + noScreenSet) / 4;
  }, 0) / (thisWeekEntries.length || 7);

  if (avgSleep < 6.5 && avgSleep > 0) {
    focusNextWeek = "Prioritize sleep consistency to ensure daytime focus remains high.";
  } else if (readingBeforeBedDays < 3) {
    focusNextWeek = "Establish a better evening routine, focusing on reading before bed.";
  } else if (workoutDays < 2) {
    focusNextWeek = "Incorporate more regular exercise blocks to maintain healthy energy levels.";
  } else if (learningBlocksCompleted < 2 && reportsSubmitted === 0) {
    focusNextWeek = "Increase structured learning sessions to build core skills.";
  } else if (targetsTested === 0 && learningBlocksCompleted > 0) {
    focusNextWeek = "Transition to evaluating active systems to apply recent learning sessions.";
  }

  return {
    weekNumber: targetWeek,
    overallStatus,
    overallStatusColor,
    overallStatusExplanation,
    consistencyScore,
    productiveDaysCount,
    learningBlocksCompleted,
    bugReportStudyBlocks,
    reconSessions,
    targetsTested,
    reportsSubmitted,
    validReports,
    averageSleep: avgSleep,
    workoutDays,
    readingBeforeBedDays,
    progressSummary,
    biggestAchievement,
    focusNextWeek
  };
}

export async function sendTestReport(): Promise<{ success: boolean; error?: string }> {
  const config = await getParentReportConfig();
  const timezone = config.time_zone || "UTC";
  
  const provider = new EmailProvider();
  const recipient = config.email_address;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(new Date());
  const yearVal = Number(parts.find(p => p.type === "year")?.value);
  const monthVal = Number(parts.find(p => p.type === "month")?.value) - 1;
  const dayVal = Number(parts.find(p => p.type === "day")?.value);
  const localDate = new Date(Date.UTC(yearVal, monthVal, dayVal));

  const targetWeek = getISOWeekUTC(localDate);
  const targetYear = getISOWeekYearUTC(localDate);

  try {
    const payload = await compileReportPayload(targetYear, targetWeek);

    return await provider.sendReport(
      config.parent_name || "Parent Test",
      recipient,
      payload
    );
  } catch (err: any) {
    return { success: false, error: err.message || "Test dispatch execution fault" };
  }
}
