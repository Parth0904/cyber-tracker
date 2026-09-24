import {
  AnalyticsSummary,
} from "@/lib/types/analytics";

import {
  Statistics,
} from "./statistics";

export function generateSummary(
  statistics: Statistics,
  canonicalConsistency = 0
): AnalyticsSummary {

  const bestDay =
    Object.entries(
      statistics.scoreMap
    ).find(
      ([, score]) =>
        score ===
        statistics.highestScore
    )?.[0] ?? "";

  const consistency = canonicalConsistency;

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