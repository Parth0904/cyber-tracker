import { Insight } from "./index";
import {
  analyzeBuckets,
  getStrength,
} from "./analyzer";

export function generateReadingInsight(
  entries: {
    date: string;
    reading: number;
  }[],
  scoreMap: Record<string, number>,
  todayReading: number
): Insight {

  const values = entries.map((day) => {

    let bucket = "";

    if (day.reading === 0)
      bucket = "No Reading";
    else if (day.reading <= 20)
      bucket = "1–20 Minutes";
    else
      bucket = "20+ Minutes";

    return {
      bucket,
      score: scoreMap[day.date] ?? 0,
    };
  });

  const result =
    analyzeBuckets(values);

return {
    habit: "Reading",

    recommendation: "...",

    explanation: "...",

    strength: "Strong",

    confidence: "High",

    completed: todayReading > 0,

    impact: result.impact,
};
}