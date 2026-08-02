import { NotificationProvider, ParentReportData } from "./NotificationProvider";

export class EmailProvider implements NotificationProvider {
  async sendReport(
    parentName: string,
    recipient: string,
    reportData: ParentReportData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!recipient || recipient.trim() === "") {
        return { success: false, error: "Recipient email address is required but undefined." };
      }

      const signalEmoji = {
        Green: "🟢 Green",
        Amber: "🟡 Amber",
        Red: "🔴 Red",
      }[reportData.consistencyState];

      const emailBody = `
=========================================
SYSTEM DISPATCH: WEEKLY STATUS REPORT
=========================================
Date: ${new Date().toISOString().split("T")[0]}
Recipient: ${parentName} <${recipient}>
Channel: SMTP (Mock Relay)

Dear ${parentName},

Here is the weekly progress report automatically compiled by Cyber Tracker.

- Week Number: Week ${reportData.weekNumber}
- Consistency Signal: ${signalEmoji}
- Hunting Hours: ${reportData.huntingHours.toFixed(1)}h
- Learning Hours: ${reportData.learningHours.toFixed(1)}h
- Reports Submitted: ${reportData.reportsSubmitted}
- Valid Reports: ${reportData.validReports}

-----------------------------------------
Generated Automatically by Cyber Tracker.
=========================================
`;
      console.log(emailBody);

      // Simulate a small delay for SMTP relay
      await new Promise(resolve => setTimeout(resolve, 300));

      return { success: true };
    } catch (err: any) {
      console.error("EmailProvider failed to relay SMTP payload:", err);
      return { success: false, error: err.message || "Unknown SMTP relay error" };
    }
  }
}
