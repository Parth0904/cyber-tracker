import { buildDailyScoreMap } from "@/lib/scoring";

import { generateReadingInsight } from "./reading";
import { generateSleepInsight } from "./sleep";
import { generateBedTimeInsight } from "./bedtime";
import { generateWorkoutInsight } from "./workout";
import { generateMobileScreenTimeInsight } from "./mobileScreenTime";

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
      dailyEntries,
      scoreMap,
      today.reading
    ),

    generateSleepInsight(
      dailyEntries,
      scoreMap,
      today.sleep_hours
    ),

    generateBedTimeInsight(
      dailyEntries,
      scoreMap,
      today.bed_time
    ),

    generateWorkoutInsight(
      dailyEntries,
      scoreMap,
      today.workout
    ),

    generateMobileScreenTimeInsight(
      dailyEntries,
      scoreMap,
      today.mobile_screen_time ?? null
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