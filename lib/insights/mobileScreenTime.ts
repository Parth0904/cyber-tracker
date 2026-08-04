/* eslint-disable @typescript-eslint/no-unused-vars */
import { Insight } from "./index";
import { analyzeBuckets, getStrength } from "./analyzer";

export function generateMobileScreenTimeInsight(
  entries: {
    date: string;
    mobile_screen_time?: number | null;
  }[],
  scoreMap: Record<string, number>,
  todayScreenTime: number | null
): Insight {
  const values = entries.map((day) => {
    let bucket = "";
    const mins = day.mobile_screen_time || 0;

    if (mins < 120) {
      bucket = "<2h Screen Time";
    } else if (mins <= 240) {
      bucket = "2h–4h Screen Time";
    } else {
      bucket = ">4h Screen Time";
    }

    return {
      bucket,
      score: scoreMap[day.date] ?? 0,
    };
  });

  const result = analyzeBuckets(values);
  const strength = getStrength(result.impact);

  let recommendation = "";
  let explanation = "";

  if (result.bestBucket === "<2h Screen Time") {
    recommendation = "Keep mobile screen time under 2 hours to maximize operational efficiency.";
    explanation = "Your data shows that keeping screen time below 2 hours correlates with your highest productivity days.";
  } else if (result.bestBucket === "2h–4h Screen Time") {
    recommendation = "Target a moderate mobile screen time of 2–4 hours.";
    explanation = "A moderate mobile screen usage of 2–4 hours correlates with good performance in your core activities.";
  } else {
    recommendation = "Monitor your mobile usage to avoid distractions.";
    explanation = "Interestingly, your productivity remains high even with higher mobile screen time, but keeping it in check is advised.";
  }

  return {
    habit: "Mobile Screen Time",
    recommendation,
    explanation,
    strength,
    confidence: result.confidence,
    completed: todayScreenTime !== null && todayScreenTime !== undefined && todayScreenTime <= 120, // Complete if under 2 hours and logged
    impact: result.impact,
  };
}
