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

  productivity: {

    score: todayScore,

    level: productivity.level,

    reason: Array.isArray(productivity.reason)
      ? productivity.reason.join(" ")
      : productivity.reason,

    contributors: productivity.contributors,

  },

  focus,

  insights,

  updatedAt: new Date().toLocaleTimeString(),

  streak: {

    current: 0,

  },

  todayActivities: todayActivities.map(activity => ({

    type: activity.type,

  })),

  activeTarget: {

    name: "No Active Target",

    status: "Recon",

    hours: 0,

    findings: 0,

    reports: 0,

  },

  currentSession: {

    active: false,

    type: "",

    target: "",

    duration: "00:00:00",

  },

  weeklyTrend: [],

  recentActivity: todayActivities.map(activity => ({

    type: activity.type,

    time: "Today",

  })),

};
}