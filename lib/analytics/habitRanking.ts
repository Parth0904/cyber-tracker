import { Insight } from "@/lib/insights/index";
import { HabitRanking } from "@/lib/types/analytics";

export function generateHabitRanking(
  insights: Insight[]
): HabitRanking[] {

  return insights.map((insight) => ({
    habit: insight.habit,

    impact: insight.impact,

    confidence:
      insight.confidence,

    strength:
      insight.strength,
  }));
}