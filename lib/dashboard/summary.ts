import { calculateCompletion } from "@/lib/completion";

import {
  calculateAverageDailyScore,
  calculateDailyScore,
  getActivityBreakdown,
} from "@/lib/scoring";

import { evaluateDay } from "@/lib/evaluation";

import { generateInsights } from "@/lib/insights";

import {
  ActivityRow,
  DailyEntry,
} from "@/lib/types";

import { DashboardResponse } from "./types";

export function generateDashboard(
  todayEntry: DailyEntry,
  allEntries: DailyEntry[],
  todayActivities: ActivityRow[],
  allActivities: ActivityRow[]
): DashboardResponse {

  const completion =
    calculateCompletion(
      todayEntry
    );

  const todayScore =
    calculateDailyScore(
      todayActivities
    );

  const averageScore =
    calculateAverageDailyScore(
      allActivities
    );

  const breakdown =
    getActivityBreakdown(
      todayActivities
    );

  const productivity =
    evaluateDay(
      todayScore,
      averageScore,
      breakdown
    );

  const {
    focus,
    insights,
  } = generateInsights(
    allEntries,
    allActivities,
    todayEntry
  );

  return {

    completion,

    productivity,

    focus,

    insights,

  };

}