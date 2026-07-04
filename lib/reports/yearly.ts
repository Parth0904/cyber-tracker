import { ReportSummary } from "./summary";
import { YearlyReport } from "./types";

export function generateYearlyReport(
  summary: ReportSummary
): YearlyReport {

  const now = new Date();

  const entries = summary.entries.filter((entry) => {

    const date = new Date(entry.date);

    return date.getFullYear() === now.getFullYear();

  });

  const activities = summary.activities.filter((activity) => {

    const date = new Date(activity.date);

    return date.getFullYear() === now.getFullYear();

  });

  const averageReading =
    entries.length === 0
      ? 0
      : entries.reduce(
          (sum, entry) => sum + entry.reading,
          0
        ) / entries.length;

  const averageSleep =
    entries.length === 0
      ? 0
      : entries.reduce(
          (sum, entry) => sum + entry.sleep_hours,
          0
        ) / entries.length;

  return {

    year: now.getFullYear(),

    averageScore: 0,

    totalActivities:
      activities.length,

    findings:
      activities.filter(
        activity =>
          activity.type === "finding"
      ).length,

    reports:
      activities.filter(
        activity =>
          activity.type === "bug_report"
      ).length,

    reward: 0,

    averageReading:
      Math.round(averageReading),

    averageSleep:
      Math.round(
        averageSleep * 10
      ) / 10,

  };

}