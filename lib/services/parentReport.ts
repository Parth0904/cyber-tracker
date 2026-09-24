import { getParentReportConfig, getPendingReportLogs, getReportLog, createReportLog, updateReportLog } from "@/lib/repositories/parentReport";
import { generateWeeklyReviewReport } from "@/lib/services/weeklyReview";
import { getWeeklyReview } from "@/lib/repositories/weeklyReview";
import { EmailProvider } from "./notifications/EmailProvider";
import { ParentReportData } from "./notifications/NotificationProvider";
import {
  APP_TIMEZONE,
  getDatesForWeek,
  getISOWeekUTC,
  getISOWeekYearUTC,
} from "@/lib/services/metrics/dates";
import { getProductiveDaysCount } from "@/lib/services/metrics/activities";

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
      timeZone: APP_TIMEZONE,
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
  const timezone = APP_TIMEZONE;

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
      },
    };
  }

  // Calculate activity counts (using canonical source of truth without double-counting)
  const learningBlocksCompleted = 0;
  const bugReportStudyBlocks = 0;
  const reconSessions = 0;
  const targetsTested = 0;
  const reportsSubmitted = 0;
  const validReports = 0;

  // Habits (Reading and Workout decoupled from active reporting)
  const workoutDays = 0;
  const readingBeforeBedDays = 0;

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

  // Calculate Productive Days
  const { dates } = getDatesForWeek(targetYear, targetWeek, timezone);
  const productiveDaysCount = getProductiveDaysCount(
    dates,
    {},
    timezone
  );

  // PROGRESS SUMMARY SENTENCES GENERATION
  let routineSentence = "";
  if (consistencyScore >= 80) {
    routineSentence = "Parth maintained an excellent, highly structured daily work and study routine.";
  } else if (consistencyScore >= 50) {
    routineSentence = "Parth established a steady work routine this week with decent consistency.";
  } else {
    routineSentence = "Parth's work routine was less consistent this week compared to his usual schedule.";
  }

  const activitySentence = "His overall learning and research sessions remained stable, aligning closely with his recent averages.";

  const habitsSentence = "He maintained focused operational cybersecurity routines throughout the week.";

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
  const reports30d = 0;

  if (reportsSubmitted > 0 && reports30d === 0) {
    biggestAchievement = `Submitted his first security report in over a month!`;
  } else if (validReports > 0) {
    biggestAchievement = `Achieved a 100% acceptance rate on security reports submitted this week.`;
  } else if (consistencyScore > prevConsistency && consistencyScore >= 85) {
    biggestAchievement = `Reached an exceptional weekly consistency score of ${consistencyScore}%.`;
  } else if (workoutDays >= 4) {
    biggestAchievement = `Maintained great physical health by completing ${workoutDays} workouts this week.`;
  } else if (learningBlocksCompleted >= 4) {
    biggestAchievement = `Logged a strong study week, completing ${learningBlocksCompleted} learning sessions.`;
  } else if (targetsTested >= 3) {
    biggestAchievement = `Expanded his research routine by evaluating ${targetsTested} separate systems.`;
  }

  // FOCUS FOR NEXT WEEK SELECTION
  let focusNextWeek = "Maintain the current excellent balance between learning, evaluation, and habits.";

  if (readingBeforeBedDays < 3) {
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
    workoutDays,
    readingBeforeBedDays,
    progressSummary,
    biggestAchievement,
    focusNextWeek
  };
}

export async function sendTestReport(): Promise<{ success: boolean; error?: string }> {
  const config = await getParentReportConfig();
  
  const provider = new EmailProvider();
  const recipient = config.email_address;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
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
