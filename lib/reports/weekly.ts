import { ReportSummary } from "./summary";
import { WeeklyReport } from "./types";

export function generateWeeklyReport(
  summary: ReportSummary
): WeeklyReport {

  const today = new Date();

  const weekAgo = new Date();

  weekAgo.setDate(today.getDate() - 7);

  const entries = summary.entries.filter((entry) => {

    const date = new Date(entry.date);

    return date >= weekAgo;

  });

  const activities = summary.activities.filter((activity) => {

    const date = new Date(activity.date);

    return date >= weekAgo;

  });

  return {
    week: `${weekAgo.toISOString().split("T")[0]} to ${today.toISOString().split("T")[0]}`,

    averageScore: 0,

    totalActivities: activities.length,

    totalSessions: 0,

    totalTargets: activities.filter(a => a.type === "target").length,

    learning:
      activities.filter(a => a.type === "learning").length,

    recon:
      activities.filter(a => a.type === "recon").length,

    testing: 0,

    reporting: 0,

    findings:
      activities.filter(a => a.type === "finding").length,

    reports:
      activities.filter(a => a.type === "bug_report").length,

    validReports: 0,

    averageReading:
      entries.length === 0
        ? 0
        : Math.round(
            entries.reduce(
              (s, e) => s + e.reading,
              0
            ) / entries.length
          ),

    averageSleep:
      entries.length === 0
        ? 0
        : Math.round(
            (
              entries.reduce(
                (s, e) => s + e.sleep_hours,
                0
              ) /
              entries.length
            ) * 10
          ) / 10,

    totalHours: 0,

    productivity: "Neutral",

    recommendation: "Maintain target scanning velocity.",
  };

}