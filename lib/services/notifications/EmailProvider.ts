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
      }[reportData.overallStatusColor];

      const emailSubject = `${signalEmoji} Weekly Performance Digest - ${reportData.overallStatus}`;
      const emailPreview = `Consistency: ${reportData.consistencyScore}% • Status: ${reportData.overallStatus} • Parth's weekly performance snapshot.`;

      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const timeStr = now.toLocaleTimeString("en-US", { hour12: false }).substring(0, 5);

      const emailBody = `Weekly Performance Digest - Week ${reportData.weekNumber}
Status: ${reportData.overallStatus} (${signalEmoji})
Explanation: ${reportData.overallStatusExplanation}

Consistency: ${reportData.consistencyScore}% (${reportData.productiveDaysCount} of 7 productive days)

Activity Summary:
- Learning Sessions Completed: ${reportData.learningBlocksCompleted}
- Security Report Study Sessions Completed: ${reportData.bugReportStudyBlocks}
- Research Sessions Completed: ${reportData.reconSessions}
- Systems Evaluated: ${reportData.targetsTested}
- Security Reports Submitted: ${reportData.reportsSubmitted}
- Accepted Security Reports: ${reportData.validReports}

Healthy Habits:
- Workout Days: ${reportData.workoutDays} days
- Reading Before Bed: ${reportData.readingBeforeBedDays} days

Weekly Progress:
${reportData.progressSummary}

Biggest Achievement:
${reportData.biggestAchievement}

Focus for Next Week:
${reportData.focusNextWeek}

Generated on ${dateStr} at ${timeStr}`;

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
      if (!recipient && !parentEmail) missingVars.push("PARENT_EMAIL");

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
      background-color: #f8fafc;
      color: #334155;
      margin: 0;
      padding: 24px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      padding: 32px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    .header {
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 24px;
      margin-bottom: 24px;
      text-align: center;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .subtitle {
      font-size: 13px;
      color: #64748b;
      margin-top: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-card {
      margin-top: 18px;
      padding: 16px;
      border-radius: 12px;
      font-weight: 500;
      font-size: 15px;
      text-align: left;
    }
    .status-Green {
      background-color: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
    }
    .status-Amber {
      background-color: #fffbeb;
      color: #92400e;
      border: 1px solid #fef3c7;
    }
    .status-Red {
      background-color: #fef2f2;
      color: #991b1b;
      border: 1px solid #fee2e2;
    }
    .status-title {
      font-weight: 700;
      font-size: 16px;
      margin: 0 0 6px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .status-desc {
      font-size: 14px;
      color: inherit;
      opacity: 0.9;
      margin: 0;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
    }
    .card-title {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 10px 0;
    }
    .big-value {
      font-size: 32px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      line-height: 1;
    }
    .small-label {
      font-size: 13px;
      color: #475569;
      margin-top: 4px;
      margin-bottom: 0;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 28px;
      margin-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }
    .item-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 14px;
    }
    .item-row:last-child {
      border-bottom: none;
    }
    .item-label {
      color: #475569;
    }
    .item-value {
      font-weight: 600;
      color: #0f172a;
    }
    .text-block {
      background-color: #f8fafc;
      border-left: 4px solid #6366f1;
      border-radius: 0 8px 8px 0;
      padding: 16px;
      font-size: 14.5px;
      line-height: 1.6;
      color: #334155;
      margin-bottom: 16px;
    }
    .achievement-block {
      background-color: #fdf2f8;
      border-left: 4px solid #ec4899;
      border-radius: 0 8px 8px 0;
      padding: 16px;
      font-size: 14.5px;
      line-height: 1.5;
      color: #831843;
      font-weight: 500;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .focus-block {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      border-radius: 0 8px 8px 0;
      padding: 16px;
      font-size: 14.5px;
      line-height: 1.5;
      color: #1e3a8a;
      font-weight: 500;
      margin-bottom: 16px;
    }
    .footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #94a3b8;
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
      <h1 class="title">Parth's Weekly Progress Report</h1>
      <div class="subtitle">Week ${reportData.weekNumber} &bull; Cyber Tracker</div>
      
      <div class="status-card status-${reportData.overallStatusColor}">
        <div class="status-title">${signalEmoji} ${reportData.overallStatus}</div>
        <p class="status-desc">${reportData.overallStatusExplanation}</p>
      </div>
    </div>
    
    <div class="grid-2">
      <div class="card">
        <h3 class="card-title">Consistency</h3>
        <p class="big-value">${reportData.consistencyScore}%</p>
        <p class="small-label">Weekly habit consistency</p>
      </div>
      <div class="card">
        <h3 class="card-title">Productive Days</h3>
        <p class="big-value">${reportData.productiveDaysCount} / 7</p>
        <p class="small-label">Days with logged activity</p>
      </div>
    </div>

    <div class="section-title">Weekly Activity Summary</div>
    <ul class="item-list">
      <li class="item-row">
        <span class="item-label">Learning Sessions Completed</span>
        <span class="item-value">${reportData.learningBlocksCompleted}</span>
      </li>
      <li class="item-row">
        <span class="item-label">Security Report Study Sessions Completed</span>
        <span class="item-value">${reportData.bugReportStudyBlocks}</span>
      </li>
      <li class="item-row">
        <span class="item-label">Research Sessions Completed</span>
        <span class="item-value">${reportData.reconSessions}</span>
      </li>
      <li class="item-row">
        <span class="item-label">Systems Evaluated</span>
        <span class="item-value">${reportData.targetsTested}</span>
      </li>
      <li class="item-row">
        <span class="item-label">Security Reports Submitted</span>
        <span class="item-value">${reportData.reportsSubmitted}</span>
      </li>
      ${reportData.validReports > 0 ? `
      <li class="item-row">
        <span class="item-label">Accepted Security Reports</span>
        <span class="item-value" style="color: #16a34a;">${reportData.validReports}</span>
      </li>
      ` : ''}
    </ul>

    <div class="section-title">Healthy Habits</div>
    <ul class="item-list">
      <li class="item-row">
        <span class="item-label">Workout Days Completed</span>
        <span class="item-value">${reportData.workoutDays} of 7 days</span>
      </li>
      <li class="item-row">
        <span class="item-label">Reading Before Bed</span>
        <span class="item-value">${reportData.readingBeforeBedDays} of 7 days</span>
      </li>
    </ul>

    <div class="section-title">Weekly Progress Summary</div>
    <div class="text-block">
      ${reportData.progressSummary}
    </div>

    <div class="section-title">Biggest Achievement</div>
    <div class="achievement-block">
      ✨ <strong>${reportData.biggestAchievement}</strong>
    </div>

    <div class="section-title">Focus for Next Week</div>
    <div class="focus-block">
      🎯 ${reportData.focusNextWeek}
    </div>

    <div class="footer">
      This is a secure, automatically generated weekly digest.<br>
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
        to: recipient || parentEmail!,
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
