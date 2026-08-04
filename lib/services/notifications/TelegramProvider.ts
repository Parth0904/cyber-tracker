import { NotificationProvider, ParentReportData } from "./NotificationProvider";

export class TelegramProvider implements NotificationProvider {
  async sendReport(
    parentName: string,
    recipient: string,
    reportData: ParentReportData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!recipient || recipient.trim() === "") {
        return { success: false, error: "Telegram chat ID is required but undefined." };
      }

      const signalEmoji = {
        Green: "🟢",
        Amber: "🟡",
        Red: "🔴",
      }[reportData.consistencyState];

      const telegramBody = `
=========================================
SYSTEM DISPATCH: WEEKLY STATUS REPORT
=========================================
Recipient Chat ID: ${recipient}
Parent Name: ${parentName}
Channel: Telegram Bot API (Mock Endpoint)

Week: Week ${reportData.weekNumber}
Status: ${signalEmoji} ${reportData.consistencyState}
Consistency Score: ${reportData.consistencyScore}/100

Hunting Hours: ${reportData.hunting.current.toFixed(1)}h
Learning Hours: ${reportData.learning.current.toFixed(1)}h
Reports Submitted: ${reportData.reportsSubmitted}
Valid Reports: ${reportData.validReports}
Workout: ${reportData.workout.current} days completed
Reading: ${reportData.reading.current} days completed
Average Sleep: ${reportData.sleep.current.toFixed(1)}h
Average Screen Time: ${reportData.screenTime.current}m
Daily Logs: ${reportData.dailyLogsCompleted} days completed
=========================================
`;
      console.log(telegramBody);

      // Simulate network request delay
      await new Promise(resolve => setTimeout(resolve, 300));

      return { success: true };
    } catch (err: any) {
      console.error("TelegramProvider failed to send payload:", err);
      return { success: false, error: err.message || "Unknown Telegram API error" };
    }
  }
}
