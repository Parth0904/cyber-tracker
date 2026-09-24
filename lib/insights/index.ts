import { buildDailyScoreMap } from "@/lib/scoring";

import { generateReadingInsight } from "./reading";
import { generateWorkoutInsight } from "./workout";

import {
  ActivityRow,
  DailyEntry,
} from "@/lib/types";

export type Insight = {
    habit: string;

    recommendation: string;

    explanation: string;

    completed: boolean;

    confidence:
        | "High"
        | "Medium"
        | "Low";

    strength:
        | "Very Strong"
        | "Strong"
        | "Moderate"
        | "Weak";

    impact: number;
};

export function generateInsights(
  dailyEntries: DailyEntry[],
  activities: ActivityRow[],
  today: DailyEntry
): {
  focus: Insight;
  insights: Insight[];
} {

  const scoreMap =
    buildDailyScoreMap(activities);

  const insights: Insight[] = [
    generateReadingInsight(
      dailyEntries.map((d) => ({ date: d.date, reading: d.reading ?? 0 })),
      scoreMap,
      today.reading ?? 0
    ),

    generateWorkoutInsight(
      dailyEntries.map((d) => ({ date: d.date, workout: d.workout ?? 0 })),
      scoreMap,
      today.workout ?? 0
    ),
  ];

  const confidenceWeight = {
    High: 3,
    Medium: 2,
    Low: 1,
};

const sorted = insights.sort((a, b) => {
    const scoreA =
        Math.abs(a.impact) *
        confidenceWeight[a.confidence];

    const scoreB =
        Math.abs(b.impact) *
        confidenceWeight[b.confidence];

    return scoreB - scoreA;
});

return {
    focus: sorted[0] ?? null,
    insights: sorted,
};
}