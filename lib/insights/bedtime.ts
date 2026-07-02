import { Insight } from "./index";
import {
  analyzeBuckets,
  getStrength,
} from "./analyzer";

export function generateBedTimeInsight(
  entries: {
    date: string;
    bed_time: string;
  }[],
  scoreMap: Record<string, number>,
  todayBedTime: string
): Insight {

  const values = entries.map((day) => {

    const hour =
      Number(day.bed_time?.split(":")[0] ?? 0);

    let bucket = "";

    if (hour < 22)
      bucket = "Before 10 PM";
    else if (hour < 23)
      bucket = "Before 11 PM";
    else
      bucket = "After 11 PM";

    return {
      bucket,
      score: scoreMap[day.date] ?? 0,
    };
  });

  const result = analyzeBuckets(values);

  return {
  habit: "Bedtime",
  recommendation: "...",
  explanation: "...",
  strength: "Strong",
  confidence: "High",
  completed: true,
impact: result.impact,
};
}