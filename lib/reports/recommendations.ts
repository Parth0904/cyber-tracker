import { MonthlyReport } from "./types";

export function generateRecommendations(
  report: MonthlyReport
): string[] {

  const recommendations: string[] = [];

  if (report.averageSleep < 7) {
    recommendations.push(
      "Increase sleep duration to improve consistency."
    );
  }

  if (report.averageReading < 30) {
    recommendations.push(
      "Read more before bed to reinforce learning."
    );
  }

  if (report.findings === 0) {
    recommendations.push(
      "Increase active hunting sessions and diversify targets."
    );
  }

  if (report.reports === 0) {
    recommendations.push(
      "Aim to submit at least one report this month."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Excellent month. Maintain your current routine."
    );
  }

  return recommendations;

}