import { Insight } from "./index";
import {
  analyzeBuckets,
  getStrength,
} from "./analyzer";

export function generateStepsInsight(
  entries: {
    date: string;
    steps: number;
  }[],
  scoreMap: Record<string, number>,
  todaySteps: number
): Insight {

  const values = entries.map((day) => {

    let bucket = "";

    if (day.steps < 5000)
      bucket = "<5k Steps";
    else if (day.steps <= 10000)
      bucket = "5k–10k Steps";
    else
      bucket = "10k+ Steps";

    return {
      bucket,
      score: scoreMap[day.date] ?? 0,
    };
  });

  const result = analyzeBuckets(values);

 return {
  habit: "Steps",
  recommendation: "...",
  explanation: "...",
  strength: "Strong",
  confidence: "High",
  completed: true,
impact: result.impact,
};
}