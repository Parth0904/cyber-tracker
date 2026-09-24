/**
 * Canonical Productivity Metrics Service
 * 
 * Central source of truth for:
 * - Activity weights and score contributions
 * - Daily score calculation
 * - Historical average score calculation
 * - Productivity level classification
 */

import { ActivityType } from "@/lib/constants";

export const ACTIVITY_WEIGHTS = {
  learning: 1,
  bug_report: 1,
  recon: 1,
  target: 2,
  finding: 10,
} as const;

export interface ActivityScoreItem {
  type: ActivityType;
  count: number;
}

export interface ActivityBreakdownItem {
  type: ActivityType;
  count: number;
  weight: number;
  contribution: number;
}

export type ProductivityLevel =
  | "Excellent"
  | "Good"
  | "Normal"
  | "Low"
  | "Poor";

/**
 * Calculates total productivity score for a list of activities.
 */
export function calculateDailyScore(activities: ActivityScoreItem[]): number {
  return activities.reduce((score, activity) => {
    const weight = ACTIVITY_WEIGHTS[activity.type] ?? 0;
    return score + weight * activity.count;
  }, 0);
}

/**
 * Detailed breakdown of score contributions by activity.
 */
export function getActivityBreakdown(activities: ActivityScoreItem[]): ActivityBreakdownItem[] {
  return activities.map((activity) => {
    const weight = ACTIVITY_WEIGHTS[activity.type] ?? 0;
    return {
      ...activity,
      weight,
      contribution: weight * activity.count,
    };
  });
}

/**
 * Builds a date -> score map from a list of dated activities.
 */
export function buildDailyScoreMap(
  activities: Array<{ date: string; type: ActivityType; count: number }>
): Record<string, number> {
  const scores: Record<string, number> = {};

  activities.forEach((activity) => {
    if (!scores[activity.date]) {
      scores[activity.date] = 0;
    }
    const weight = ACTIVITY_WEIGHTS[activity.type] ?? 0;
    scores[activity.date] += weight * activity.count;
  });

  return scores;
}

/**
 * Calculates user's historical average daily score from their activity history.
 */
export function calculateAverageDailyScore(
  activities: Array<{ date: string; type: ActivityType; count: number }>
): number {
  const dates = [...new Set(activities.map((a) => a.date))];
  if (dates.length === 0) return 0;

  const scoreMap = buildDailyScoreMap(activities);
  const total = dates.reduce((sum, d) => sum + (scoreMap[d] || 0), 0);
  return Math.round((total / dates.length) * 10) / 10;
}

/**
 * Classifies day's productivity level relative to historical baseline.
 */
export function classifyProductivity(
  todayScore: number,
  averageScore: number
): ProductivityLevel {
  if (averageScore === 0) {
    return todayScore > 0 ? "Good" : "Normal";
  }

  const ratio = todayScore / averageScore;
  if (ratio >= 1.5) return "Excellent";
  if (ratio >= 1.2) return "Good";
  if (ratio >= 0.8) return "Normal";
  if (ratio >= 0.5) return "Low";
  return "Poor";
}
