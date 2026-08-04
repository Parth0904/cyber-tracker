/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  PeriodReport,
  TimeRange,
} from "@/lib/types/analytics";

import {
  Statistics,
} from "./statistics";

export function generatePeriodReport(
  statistics: Statistics,
  _range: TimeRange
): PeriodReport {

  return {

    averageScore: Number(
      statistics.averageScore.toFixed(
        1
      )
    ),

    bestScore:
      statistics.highestScore,

    completion:
      statistics.completionRate,

    totalActivities:
      statistics.totalActivities,

    bestHabit: "",

    weakestHabit: "",
  };
}