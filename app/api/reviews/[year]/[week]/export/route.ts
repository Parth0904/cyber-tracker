import { NextRequest, NextResponse } from "next/server";
import { getWeeklyReview } from "@/lib/repositories/weeklyReview";
import { generateWeeklyReviewReport } from "@/lib/services/weeklyReview";
import { APP_TIMEZONE, getTodayDateString } from "@/lib/services/metrics/dates";

type RouteParams = {
  params: Promise<{
    year: string;
    week: string;
  }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { year, week } = await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "markdown";

    const yearNum = Number(year);
    const weekNum = Number(week);

    if (isNaN(yearNum) || isNaN(weekNum)) {
      return NextResponse.json({ error: "Invalid year or week number" }, { status: 400 });
    }

    // Retrieve report
    let report: any = null;
    const saved = await getWeeklyReview(yearNum, weekNum);
    if (saved) {
      report = JSON.parse(saved.report_json);
    } else {
      report = await generateWeeklyReviewReport(yearNum, weekNum);
    }

    const filename = `cyber-tracker-review-${year}-w${week}`;

    if (format === "json") {
      const jsonStr = JSON.stringify(report, null, 2);
      return new Response(jsonStr, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.json"`,
        },
      });
    }

    // Generate Markdown report with 10 sections
    const md = `# Cyber Tracker Weekly Executive Review

**Period**: Week ${report.weekNumber} (${report.startDate} to ${report.endDate})
**Year**: ${report.year}

---

## 1. Executive Summary
- **Consistency State**: ${report.executiveSummary.consistencyState.toUpperCase()}
- **Consistency Score**: ${report.executiveSummary.consistencyScore}%
- **Trend**: ${report.executiveSummary.consistencyTrendText}

${report.executiveSummary.summaryText}

---

## 2. Work Summary
- **Total Hunting Hours**: ${report.workSummary.totalHuntingHours.toFixed(1)}h
- **Total Learning Hours**: ${report.workSummary.totalLearningHours.toFixed(1)}h
- **Total Sessions**: ${report.workSummary.totalSessions}
- **Targets Worked On**: ${report.workSummary.targetsWorkedOn.join(", ") || "None"}
- **Topics Studied**: ${report.workSummary.topicsStudied.join(", ") || "None"}
- **Reports Submitted**: ${report.workSummary.reportsSubmitted}
- **Valid Reports**: ${report.workSummary.validReports}

---

## 3. Comparison
### vs Previous Week:
- **Hunting Hours**: ${report.comparison.huntingHours.prevWeekDiffPercent >= 0 ? `+${report.comparison.huntingHours.prevWeekDiffPercent}` : report.comparison.huntingHours.prevWeekDiffPercent}%
- **Learning Hours**: ${report.comparison.learningHours.prevWeekDiffPercent >= 0 ? `+${report.comparison.learningHours.prevWeekDiffPercent}` : report.comparison.learningHours.prevWeekDiffPercent}%
- **Consistency Score**: ${report.comparison.consistency.prevWeekDiffPercent >= 0 ? `+${report.comparison.consistency.prevWeekDiffPercent}` : report.comparison.consistency.prevWeekDiffPercent}%
- **Reports Submitted**: ${report.comparison.reportsSubmitted.prevWeekDiffPercent >= 0 ? `+${report.comparison.reportsSubmitted.prevWeekDiffPercent}` : report.comparison.reportsSubmitted.prevWeekDiffPercent}%
- **Valid Reports**: ${report.comparison.validReports.prevWeekDiffPercent >= 0 ? `+${report.comparison.validReports.prevWeekDiffPercent}` : report.comparison.validReports.prevWeekDiffPercent}%

### vs 30-Day Average (Weekly Scaled):
- **Hunting Hours**: ${report.comparison.huntingHours.avg30dDiffPercent >= 0 ? `+${report.comparison.huntingHours.avg30dDiffPercent}` : report.comparison.huntingHours.avg30dDiffPercent}% (Avg: ${report.comparison.huntingHours.avg30dValue.toFixed(1)}h)
- **Learning Hours**: ${report.comparison.learningHours.avg30dDiffPercent >= 0 ? `+${report.comparison.learningHours.avg30dDiffPercent}` : report.comparison.learningHours.avg30dDiffPercent}% (Avg: ${report.comparison.learningHours.avg30dValue.toFixed(1)}h)
- **Consistency Score**: ${report.comparison.consistency.avg30dDiffPercent >= 0 ? `+${report.comparison.consistency.avg30dDiffPercent}` : report.comparison.consistency.avg30dDiffPercent}% (Avg: ${report.comparison.consistency.avg30dValue}%)
- **Reports Submitted**: ${report.comparison.reportsSubmitted.avg30dDiffPercent >= 0 ? `+${report.comparison.reportsSubmitted.avg30dDiffPercent}` : report.comparison.reportsSubmitted.avg30dDiffPercent}% (Avg: ${report.comparison.reportsSubmitted.avg30dValue.toFixed(1)})
- **Valid Reports**: ${report.comparison.validReports.avg30dDiffPercent >= 0 ? `+${report.comparison.validReports.avg30dDiffPercent}` : report.comparison.validReports.avg30dDiffPercent}% (Avg: ${report.comparison.validReports.avg30dValue.toFixed(1)})

---

## 4. Top Targets
${report.topTargetsRanked.map((t: any, idx: number) => `
### ${idx + 1}. ${t.name}
- **Hunting Duration**: ${t.hours.toFixed(1)}h
- **Reports Submitted**: ${t.reportsSubmitted}
- **Valid Reports**: ${t.validReports}
- **Hours per Valid Report**: ${t.hoursPerValidReport}
`).join("\n") || "No hunting operations logged."}

---

## 5. Top Learning Topics
${report.topLearningRanked.map((t: any, idx: number) => `
### ${idx + 1}. ${t.name}
- **Study Duration**: ${t.hours.toFixed(1)}h
- **Sessions**: ${t.sessions}
- **Last Studied**: ${t.lastStudied}
`).join("\n") || "No learning sessions logged."}

---

## 6. Discoveries
${report.discoveries.map((d: any) => `- **Observation**: ${d.text}\n  *Confidence Level*: **${d.confidence}**`).join("\n\n") || "Insufficient historical data to assert discoveries."}

---

## 7. Habit & Operational Review
- **Execution Completion Rate**: ${report.habitReview.completionRate}%
- **Operational Consistency Score**: ${report.habitReview.consistencyScore}%

---

## 8. Factual Achievements
${report.achievements.map((a: any) => `- ${a}`).join("\n") || "No achievements recorded."}

---

## 9. Recommendations
${report.recommendations.map((r: any) => `- ${r}`).join("\n") || "No data-driven recommendations generated."}

---

## 10. Next Week Snapshot
- **Focus Target**: ${report.nextWeekSnapshot.focusTarget}
- **Focus Topic**: ${report.nextWeekSnapshot.focusTopic}
- **Consistency Goal**: ${report.nextWeekSnapshot.consistencyGoal}
- **Planning Summary**: ${report.nextWeekSnapshot.planningSummary}

---

*Report compiled on: ${getTodayDateString(APP_TIMEZONE)}. Powered by Cyber Tracker intelligence system.*
`;

    return new Response(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.md"`,
      },
    });
  } catch (err) {
    console.error("Export weekly review failed:", err);
    return NextResponse.json(
      { error: "Failed to export weekly review" },
      { status: 500 }
    );
  }
}
