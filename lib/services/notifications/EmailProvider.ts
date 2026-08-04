import { NotificationProvider, ParentReportData } from "./NotificationProvider";
import nodemailer from "nodemailer";

export class EmailProvider implements NotificationProvider {
  async sendReport(
    parentName: string,
    recipient: string,
    reportData: ParentReportData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const signalEmoji = {
        Green: "🟢",
        Amber: "🟡",
        Red: "🔴",
      }[reportData.consistencyState];

      const emailSubject = `${signalEmoji} Cyber Tracker Weekly Report – ${reportData.consistencyState}`;
      const emailPreview = `Consistency: ${reportData.consistencyScore}/100 • Hunting: ${reportData.hunting.current.toFixed(1)}h • Learning: ${reportData.learning.current.toFixed(1)}h`;

      const formatDiff = (curr: number, prev: number, suffix: string = "") => {
        const diff = curr - prev;
        const sign = diff > 0 ? "+" : "";
        return `${sign}${diff.toFixed(1)}${suffix} (${curr.toFixed(1)}${suffix} vs ${prev.toFixed(1)}${suffix})`;
      };

      const formatDaysDiff = (curr: number, prev: number) => {
        const diff = curr - prev;
        const sign = diff > 0 ? "+" : "";
        const dayStr = Math.abs(diff) === 1 ? "day" : "days";
        const currDayStr = curr === 1 ? "day" : "days";
        const prevDayStr = prev === 1 ? "day" : "days";
        return `${sign}${diff} ${dayStr} (${curr} ${currDayStr} vs ${prev} ${prevDayStr})`;
      };

      const formatScreenTimeDiff = (curr: number, prev: number) => {
        const diff = curr - prev;
        const sign = diff > 0 ? "+" : "";
        return `${sign}${diff}m (${curr}m vs ${prev}m)`;
      };

      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const timeStr = now.toLocaleTimeString("en-US", { hour12: false }).substring(0, 5);

      const emailBody = `Week: Week ${reportData.weekNumber}
Status: ${signalEmoji} ${reportData.consistencyState}
Consistency Score: ${reportData.consistencyScore}/100

--------------------

Work

• Hunting Hours: ${reportData.hunting.current.toFixed(1)}h
• Learning Hours: ${reportData.learning.current.toFixed(1)}h
• Reports Submitted: ${reportData.reportsSubmitted}
• Valid Reports: ${reportData.validReports}

--------------------

Habits

• Workout: ${reportData.workout.current} days completed
• Reading: ${reportData.reading.current} days completed
• Average Sleep: ${reportData.sleep.current.toFixed(1)} hours
• Average Mobile Screen Time: ${reportData.screenTime.current} minutes
• Daily Logs Completed: ${reportData.dailyLogsCompleted} days completed

--------------------

Compared to Last Week

• Hunting: ${formatDiff(reportData.hunting.current, reportData.hunting.previous, "h")}
• Learning: ${formatDiff(reportData.learning.current, reportData.learning.previous, "h")}
• Reading: ${formatDaysDiff(reportData.reading.current, reportData.reading.previous)}
• Workout: ${formatDaysDiff(reportData.workout.current, reportData.workout.previous)}
• Sleep: ${formatDiff(reportData.sleep.current, reportData.sleep.previous, "h")}
• Mobile Screen Time: ${formatScreenTimeDiff(reportData.screenTime.current, reportData.screenTime.previous)}

--------------------

Generated

${dateStr}
${timeStr}`;

      // Keep the console logging for development
      console.log("-----------------------------------------");
      console.log(`Subject: ${emailSubject}`);
      console.log(`Preview: ${emailPreview}`);
      console.log("-----------------------------------------");
      console.log(emailBody);
      console.log("-----------------------------------------");

      // Validate SMTP environment variables
      const host = process.env.SMTP_HOST;
      const portStr = process.env.SMTP_PORT;
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      const parentEmail = process.env.PARENT_EMAIL;

      const missingVars = [];
      if (!host) missingVars.push("SMTP_HOST");
      if (!portStr) missingVars.push("SMTP_PORT");
      if (!user) missingVars.push("SMTP_USER");
      if (!pass) missingVars.push("SMTP_PASS");
      if (!parentEmail) missingVars.push("PARENT_EMAIL");

      if (missingVars.length > 0) {
        return {
          success: false,
          error: `SMTP configuration is missing required environment variables: ${missingVars.join(", ")}`
        };
      }

      // Generate HTML body
      const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${emailSubject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0f19;
      color: #f1f5f9;
      margin: 0;
      padding: 24px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #111827;
      border-radius: 12px;
      border: 1px solid #1f2937;
      padding: 32px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
    }
    .header {
      border-bottom: 2px solid #1f2937;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
    }
    .subtitle {
      font-size: 14px;
      color: #9ca3af;
      margin-top: 4px;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 12px;
    }
    .status-Green {
      background-color: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .status-Amber {
      background-color: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .status-Red {
      background-color: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 28px;
      margin-bottom: 12px;
      border-bottom: 1px solid #1f2937;
      padding-bottom: 6px;
    }
    .metric-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .metric-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(31, 41, 55, 0.5);
      font-size: 14px;
    }
    .metric-item:last-child {
      border-bottom: none;
    }
    .metric-label {
      color: #9ca3af;
    }
    .metric-value {
      font-weight: 600;
      color: #f3f4f6;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #1f2937;
      font-size: 12px;
      color: #4b5563;
      text-align: center;
    }
  </style>
</head>
<body>
  <!-- Hidden preheader text for email clients -->
  <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0;">
    ${emailPreview}
  </div>
  
  <div class="container">
    <div class="header">
      <h1 class="title">Weekly Performance Report</h1>
      <div class="subtitle">Week ${reportData.weekNumber} &bull; Cyber Tracker</div>
      <div class="status-badge status-${reportData.consistencyState}">
        ${signalEmoji} Consistency Status: ${reportData.consistencyState} (Score: ${reportData.consistencyScore}/100)
      </div>
    </div>
    
    <div class="section-title">Work Metrics</div>
    <ul class="metric-list">
      <li class="metric-item">
        <span class="metric-label">Hunting Hours</span>
        <span class="metric-value">${reportData.hunting.current.toFixed(1)}h</span>
      </li>
      <li class="metric-item">
        <span class="metric-label">Learning Hours</span>
        <span class="metric-value">${reportData.learning.current.toFixed(1)}h</span>
      </li>
      <li class="metric-item">
        <span class="metric-label">Reports Submitted</span>
        <span class="metric-value">${reportData.reportsSubmitted}</span>
      </li>
      <li class="metric-item">
        <span class="metric-label">Valid Reports</span>
        <span class="metric-value">${reportData.validReports}</span>
      </li>
    </ul>

    <div class="section-title">Habits</div>
    <ul class="metric-list">
      <li class="metric-item">
        <span class="metric-label">Workout Completed</span>
        <span class="metric-value">${reportData.workout.current} days</span>
      </li>
      <li class="metric-item">
        <span class="metric-label">Reading Completed</span>
        <span class="metric-value">${reportData.reading.current} days</span>
      </li>
      <li class="metric-item">
        <span class="metric-label">Average Sleep</span>
        <span class="metric-value">${reportData.sleep.current.toFixed(1)} hours</span>
      </li>
      <li class="metric-item">
        <span class="metric-label">Average Mobile Screen Time</span>
        <span class="metric-value">${reportData.screenTime.current} minutes</span>
      </li>
      <li class="metric-item">
        <span class="metric-label">Daily Logs Completed</span>
        <span class="metric-value">${reportData.dailyLogsCompleted} days</span>
      </li>
    </ul>

    <div class="section-title">Weekly Comparison</div>
    <ul class="metric-list">
      <li class="metric-item">
        <span class="metric-label">Hunting Difference</span>
        <span class="metric-value">${formatDiff(reportData.hunting.current, reportData.hunting.previous, "h")}</span>
      </li>
      <li class="metric-item">
        <span class="metric-label">Learning Difference</span>
        <span class="metric-value">${formatDiff(reportData.learning.current, reportData.learning.previous, "h")}</span>
      </li>
      <li class="metric-item">
        <span class="metric-label">Reading Difference</span>
        <span class="metric-value">${formatDaysDiff(reportData.reading.current, reportData.reading.previous)}</span>
      </li>
      <li class="metric-item">
        <span class="metric-label">Workout Difference</span>
        <span class="metric-value">${formatDaysDiff(reportData.workout.current, reportData.workout.previous)}</span>
      </li>
      <li class="metric-item">
        <span class="metric-label">Sleep Difference</span>
        <span class="metric-value">${formatDiff(reportData.sleep.current, reportData.sleep.previous, "h")}</span>
      </li>
      <li class="metric-item">
        <span class="metric-label">Mobile Screen Time Difference</span>
        <span class="metric-value">${formatScreenTimeDiff(reportData.screenTime.current, reportData.screenTime.previous)}</span>
      </li>
    </ul>

    <div class="footer">
      Generated on ${dateStr} at ${timeStr}<br>
      Cyber Tracker Operations Engine
    </div>
  </div>
</body>
</html>`;

      const transporter = nodemailer.createTransport({
        host: host!,
        port: parseInt(portStr!, 10),
        secure: portStr === "465",
        auth: {
          user: user!,
          pass: pass!,
        },
      });

      await transporter.sendMail({
        from: `"Cyber Tracker" <${user!}>`,
        to: parentEmail!,
        subject: emailSubject,
        text: emailBody,
        html: emailHtml,
      });

      return { success: true };
    } catch (err: any) {
      console.error("EmailProvider failed to relay SMTP payload:", err);
      return { success: false, error: err.message || "Unknown SMTP relay error" };
    }
  }
}
