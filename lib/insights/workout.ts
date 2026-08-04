/* eslint-disable @typescript-eslint/no-unused-vars */
import { Insight } from "./index";
import {
  analyzeBuckets,
} from "./analyzer";

export function generateWorkoutInsight(
  entries: {
    date: string;
    workout: number;
  }[],
  scoreMap: Record<string, number>,
  _todayWorkout: number
): Insight {

  const values = entries.map((day) => ({
    bucket:
      day.workout
        ? "Workout"
        : "No Workout",

    score:
      scoreMap[day.date] ?? 0,
  }));

  const result = analyzeBuckets(values);

 return {
  habit: "Workout",
  recommendation: "...",
  explanation: "...",
  strength: "Strong",
  confidence: "High",
  completed: true,
impact: result.impact,
};
}