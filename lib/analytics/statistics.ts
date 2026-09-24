import { ActivityRow, DailyEntry } from "@/lib/types";
import { buildDailyScoreMap } from "@/lib/services/metrics/productivity";
import { calculateDailyCompletion } from "@/lib/services/metrics/completion";

export type Statistics = {
  scoreMap: Record<string, number>;

  scores: number[];

  averageScore: number;

  highestScore: number;

  totalDays: number;

  totalActivities: number;

  completionRate: number;
};

export function buildStatistics(
  dailyEntries: DailyEntry[],
  activities: ActivityRow[]
): Statistics {

  const scoreMap =
    buildDailyScoreMap(activities);

  const scores =
    Object.values(scoreMap);

  const averageScore =
    scores.length === 0
      ? 0
      : scores.reduce(
          (a, b) => a + b,
          0
        ) / scores.length;

  const highestScore =
    scores.length === 0
      ? 0
      : Math.max(...scores);

  const totalActivities =
    activities.reduce(
      (sum, activity) =>
        sum + activity.count,
      0
    );

  const completionRate =
    dailyEntries.length === 0
      ? 0
      : Math.round(
          (dailyEntries.filter(
            (day) => calculateDailyCompletion(day).isFullyCompleted
          ).length /
            dailyEntries.length) *
            100
        );

  return {
    scoreMap,

    scores,

    averageScore,

    highestScore,

    totalDays:
      dailyEntries.length,

    totalActivities,

    completionRate,
  };
}