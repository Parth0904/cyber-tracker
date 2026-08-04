import { GoalProgress } from "./types";

export function calculateGoalProgress(
  title: string,
  current: number,
  target: number
): GoalProgress {

  const percentage =
    target === 0
      ? 100
      : Math.min(
          100,
          Math.round(
            (current / target) * 100
          )
        );

  return {

    title,

    current,

    target,

    percentage,

    completed:
      current >= target,

  };

}