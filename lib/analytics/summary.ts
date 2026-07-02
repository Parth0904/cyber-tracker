import {
  AnalyticsSummary,
} from "@/lib/types/analytics";

import {
  Statistics,
} from "./statistics";

export function generateSummary(
  statistics: Statistics
): AnalyticsSummary {

  const bestDay =
    Object.entries(
      statistics.scoreMap
    ).find(
      ([, score]) =>
        score ===
        statistics.highestScore
    )?.[0] ?? "";

  const variance =
    statistics.scores.reduce(
      (sum, score) =>
        sum +
        Math.pow(
          score -
            statistics.averageScore,
          2
        ),
      0
    ) /
    Math.max(
      statistics.scores.length,
      1
    );

  const consistency =
    Math.max(
      0,
      Math.round(
        100 -
          Math.sqrt(variance) *
            10
      )
    );

  return {
    averageScore: Number(
      statistics.averageScore.toFixed(
        1
      )
    ),

    highestScore:
      statistics.highestScore,

    totalDays:
      statistics.totalDays,

    completionRate:
      statistics.completionRate,

    bestDay,

    consistency,
  };
}