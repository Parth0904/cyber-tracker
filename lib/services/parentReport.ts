import { getISOWeek, getISOWeekYear, subWeeks } from "date-fns";
import { getParentReportConfig, getPendingReportLogs, getReportLog, createReportLog, updateReportLog } from "@/lib/repositories/parentReport";
import { generateWeeklyReviewReport } from "@/lib/services/weeklyReview";
import { getWeeklyReview } from "@/lib/repositories/weeklyReview";
import { EmailProvider } from "./notifications/EmailProvider";
import { TelegramProvider } from "./notifications/TelegramProvider";
import { NotificationProvider, ParentReportData } from "./notifications/NotificationProvider";

export async function sendPendingReports(): Promise<void> {
  const config = await getParentReportConfig();
  if (config.enabled === 0) return;

  const pending = await getPendingReportLogs();
  if (pending.length === 0) return;

  // Resolve notification provider
  let provider: NotificationProvider;
  let recipient = "";

  if (config.delivery_method === "Email") {
    provider = new EmailProvider();
    recipient = config.email_address;
  } else if (config.delivery_method === "Telegram") {
    provider = new TelegramProvider();
    recipient = config.telegram_chat_id;
  } else {
    console.warn(`Unsupported parent report delivery method: ${config.delivery_method}`);
    return;
  }

  for (const log of pending) {
    try {
      // 1. Fetch weekly review (load cached report or generate on the fly)
      const review = await getWeeklyReview(log.year, log.week_number);
      let reportData: any;
      if (review) {
        reportData = JSON.parse(review.report_json);
      } else {
        reportData = await generateWeeklyReviewReport(log.year, log.week_number);
      }

      const consistencyState: "Green" | "Amber" | "Red" = 
        reportData.executiveSummary.consistencyState === "green" ? "Green" :
        reportData.executiveSummary.consistencyState === "amber" ? "Amber" : "Red";

      const reportPayload: ParentReportData = {
        weekNumber: reportData.weekNumber,
        consistencyState,
        huntingHours: reportData.workSummary.totalHuntingHours,
        learningHours: reportData.workSummary.totalLearningHours,
        reportsSubmitted: reportData.workSummary.reportsSubmitted,
        validReports: reportData.workSummary.validReports,
      };

      // 2. Deliver via provider
      const dispatch = await provider.sendReport(
        config.parent_name || "Parent",
        recipient,
        reportPayload
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

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: config.time_zone || "UTC",
      weekday: "long",
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    weekday = parts.find(p => p.type === "weekday")?.value || "";
    hour = Number(parts.find(p => p.type === "hour")?.value || "12");
    minute = Number(parts.find(p => p.type === "minute")?.value || "0");
  } catch (err) {
    console.error("Timezone matching error in checkAndQueueReport:", err);
    return;
  }

  // Reports trigger automatically every Sunday after the configured delivery_time (e.g. "20:00")
  if (weekday !== "Sunday") {
    // If not Sunday, still process any pending reports that failed previously
    await sendPendingReports();
    return;
  }

  // Parse delivery target time
  const [targetHour, targetMinute] = (config.delivery_time || "20:00").split(":").map(Number);
  const currentMinutes = hour * 60 + minute;
  const targetMinutes = targetHour * 60 + targetMinute;

  if (currentMinutes < targetMinutes) {
    // Before scheduled time, skip queueing but check for existing retry jobs
    await sendPendingReports();
    return;
  }

  // Sunday target time met. Queue report for the ending week (today's ISO week!)
  const today = new Date();
  const week = getISOWeek(today);
  const year = getISOWeekYear(today);

  // Check if already queued
  const logExists = await getReportLog(year, week);
  if (!logExists) {
    console.log(`Queueing Parent Weekly Report for ${year} Week ${week}`);
    await createReportLog(year, week);
  }

  // Dispatch reports
  await sendPendingReports();
}

export async function sendTestReport(): Promise<{ success: boolean; error?: string }> {
  const config = await getParentReportConfig();
  
  let provider: NotificationProvider;
  let recipient = "";

  if (config.delivery_method === "Email") {
    provider = new EmailProvider();
    recipient = config.email_address;
  } else if (config.delivery_method === "Telegram") {
    provider = new TelegramProvider();
    recipient = config.telegram_chat_id;
  } else {
    return { success: false, error: `Unsupported delivery method: ${config.delivery_method}` };
  }

  // For testing, compile review for the previous calendar week or generate mock review
  const today = new Date();
  const targetWeek = getISOWeek(today);
  const targetYear = getISOWeekYear(today);

  try {
    let reportData: any;
    try {
      const review = await getWeeklyReview(targetYear, targetWeek);
      if (review) {
        reportData = JSON.parse(review.report_json);
      } else {
        reportData = await generateWeeklyReviewReport(targetYear, targetWeek);
      }
    } catch {
      // Fallback fallback if database has zero telemetry records to calculate
      reportData = {
        weekNumber: targetWeek,
        executiveSummary: { consistencyState: "green" },
        workSummary: {
          totalHuntingHours: 8.5,
          totalLearningHours: 4.0,
          totalSessions: 5,
          reportsSubmitted: 2,
          validReports: 1,
        },
      };
    }

    const consistencyState: "Green" | "Amber" | "Red" = 
      reportData.executiveSummary.consistencyState === "green" ? "Green" :
      reportData.executiveSummary.consistencyState === "amber" ? "Amber" : "Red";

    const payload: ParentReportData = {
      weekNumber: reportData.weekNumber,
      consistencyState,
      huntingHours: reportData.workSummary.totalHuntingHours,
      learningHours: reportData.workSummary.totalLearningHours,
      reportsSubmitted: reportData.workSummary.reportsSubmitted,
      validReports: reportData.workSummary.validReports,
    };

    return await provider.sendReport(
      config.parent_name || "Parent Test",
      recipient,
      payload
    );
  } catch (err: any) {
    return { success: false, error: err.message || "Test dispatch execution fault" };
  }
}
