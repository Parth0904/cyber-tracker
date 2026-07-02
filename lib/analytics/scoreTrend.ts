import { ActivityRow } from "@/lib/types";

import {
  ScorePoint,
} from "@/lib/types/analytics";

import {
  buildStatistics,
} from "./statistics";

export function generateScoreTrend(
  activities: ActivityRow[]
): ScorePoint[] {

  const stats =
    buildStatistics([], activities);

  return Object.entries(
    stats.scoreMap
  )
    .sort(([a], [b]) =>
      a.localeCompare(b)
    )
    .map(([date, score]) => ({
      date,
      score,
    }));
}