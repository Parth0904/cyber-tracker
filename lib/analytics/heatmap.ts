import {
  HeatmapDay,
} from "@/lib/types/analytics";

import {
  Statistics,
} from "./statistics";

export function generateHeatmap(
  statistics: Statistics
): HeatmapDay[] {

  return Object.entries(
    statistics.scoreMap
  ).map(
    ([date, score]) => ({
      date,
      score,
    })
  );

}