import { Insight } from "./index";
import {
  analyzeBuckets,
  getStrength,
} from "./analyzer";

export function generateSleepInsight(
  entries: {
    date: string;
    sleep_hours: number;
  }[],
  scoreMap: Record<string, number>,
  todaySleep: number
): Insight {

  const values = entries.map((day) => {

    let bucket = "";

    if (day.sleep_hours < 6)
      bucket = "<6 Hours";
    else if (day.sleep_hours <= 8)
      bucket = "6–8 Hours";
    else
      bucket = "8+ Hours";

    return {
      bucket,
      score: scoreMap[day.date] ?? 0,
    };
  });

  const result = analyzeBuckets(values);

 return {
  habit: "Sleep",
  recommendation: "...",
  explanation: "...",
  strength: "Strong",
  confidence: "High",
  completed: true,
impact: result.impact,
};
}