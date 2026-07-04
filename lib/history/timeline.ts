import {
  calculateCompletion,
} from "@/lib/completion";

import {
  calculateDailyScore,
  getActivityBreakdown,
  calculateAverageDailyScore,
} from "@/lib/scoring";

import {
  evaluateDay,
} from "@/lib/evaluation";

import {
  generateInsights,
} from "@/lib/insights";

import {
  ActivityRow,
  DailyEntry,
} from "@/lib/types";

type HistoryDay = {
  date: string;
  score: number;
  completion: number;
  productivity: ReturnType<typeof evaluateDay>;
  daily: DailyEntry;
  activities: {
    learning: number;
    bug_report: number;
    recon: number;
    target: number;
    finding: number;
  };
  focus: ReturnType<typeof generateInsights>["focus"];
  insights: ReturnType<typeof generateInsights>["insights"];
};

export function generateHistoryTimeline(
  entries: DailyEntry[],
  activities: ActivityRow[]
): HistoryDay[] {

  const averageScore =
    calculateAverageDailyScore(
      activities
    );

  return entries
    .map((entry) => {

      const dayActivities =
        activities.filter(
          (activity) =>
            activity.date ===
            entry.date
        );

      const activityCounts = {
        learning: 0,
        bug_report: 0,
        recon: 0,
        target: 0,
        finding: 0,
      };

      dayActivities.forEach(
        (activity) => {
          activityCounts[
            activity.type
          ] += activity.count;
        }
      );

      const score =
        calculateDailyScore(
          dayActivities
        );

      const completion =
        calculateCompletion(
          entry
        ).percent;

      const productivity =
        evaluateDay(
          score,
          averageScore,
          getActivityBreakdown(
            dayActivities
          )
        );

      const {
  focus,
  insights,
} = generateInsights(
  entries,
  activities,
  entry
);

     return {

  id: entry.date,

  date: entry.date,

  time: entry.bed_time ?? "--:--",

  title: `Daily Summary • ${productivity.level}`,

  description: `${completion}% completion • ${score} productivity score`,

  type: "habit",

  meta:
    `Learning ${activityCounts.learning} • ` +
    `Recon ${activityCounts.recon} • ` +
    `Findings ${activityCounts.finding}`,

};

    })

    .sort((a, b) =>
      b.date.localeCompare(
        a.date
      )
    );

}