import { ReportSummary } from "./summary";
import { MonthlyReport } from "./types";

export function generateMonthlyReport(
  summary: ReportSummary
): MonthlyReport {

  const now = new Date();

  const entries = summary.entries.filter((entry) => {

    const date = new Date(entry.date);

    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );

  });

  const activities = summary.activities.filter((activity) => {

    const date = new Date(activity.date);

    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );

  });

  const averageSleep =
    entries.length === 0
      ? 0
      : entries.reduce(
          (sum, entry) => sum + entry.sleep_hours,
          0
        ) / entries.length;

  const averageReading =
    entries.length === 0
      ? 0
      : entries.reduce(
          (sum, entry) => sum + entry.reading,
          0
        ) / entries.length;

  const workoutDays =
    entries.filter(
      (entry) => entry.workout
    ).length;

  const bestHabit =
    averageReading >= 45
      ? "Reading"
      : averageSleep >= 8
      ? "Sleep"
      : workoutDays >= entries.length / 2
      ? "Workout"
      : "Consistency";

  const weakestHabit =
    averageReading < 20
      ? "Reading"
      : averageSleep < 7
      ? "Sleep"
      : workoutDays < entries.length / 3
      ? "Workout"
      : "None";

  return {

  month: now.toLocaleString("default", {
    month: "long",
  }),

  averageScore: 0,

  totalActivities: activities.length,

  totalSessions: 0,

  totalTargets: 0,

  averageReading: Math.round(averageReading),

  averageSleep:
    Math.round(averageSleep * 10) / 10,

  bestHabit,

  weakestHabit,

  streak: 0,

  findings:
    activities.filter(
      a => a.type === "finding"
    ).length,

  reports:
    activities.filter(
      a => a.type === "bug_report"
    ).length,

  validReports: 0,

  totalHours: 0,

  productivity: "Average",

  recommendation:
    "Continue hunting consistently.",

};

}