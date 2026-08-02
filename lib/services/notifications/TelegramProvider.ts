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
        Green: "🟢 Green",
        Amber: "🟡 Amber",
        Red: "🔴 Red",
      }[reportData.consistencyState];

      const telegramBody = `
=========================================
SYSTEM DISPATCH: WEEKLY STATUS REPORT
=========================================
Recipient Chat ID: ${recipient}
Parent Name: ${parentName}
Channel: Telegram Bot API (Mock Endpoint)

Weekly report automatically compiled by Cyber Tracker for ${parentName}:

Week Number: Week ${reportData.weekNumber}
Consistency Signal: ${signalEmoji}
Hunting Hours: ${reportData.huntingHours.toFixed(1)}h
Learning Hours: ${reportData.learningHours.toFixed(1)}h
Reports Submitted: ${reportData.reportsSubmitted}
Valid Reports: ${reportData.validReports}

Generated Automatically by Cyber Tracker.
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
