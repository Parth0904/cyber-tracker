import { DailyEntry } from "@/lib/types";
import { calculateDailyCompletion } from "@/lib/services/metrics/completion";

export type Streak = {
  current: number;
  longest: number;
  completedDays: number;
  completionRate: number;
};

export function generateStreak(
  entries: DailyEntry[]
): Streak {

  if (!entries.length) {
    return {
      current: 0,
      longest: 0,
      completedDays: 0,
      completionRate: 0,
    };
  }

  const sorted = [...entries].sort(
    (a, b) =>
      a.date.localeCompare(b.date)
  );

  let current = 0;
  let longest = 0;
  let running = 0;
  let completed = 0;

  for (const entry of sorted) {
    if (calculateDailyCompletion(entry).isFullyCompleted) {
      completed++;
      running++;

      longest = Math.max(
        longest,
        running
      );
    } else {
      running = 0;
    }
  }

  for (
    let i = sorted.length - 1;
    i >= 0;
    i--
  ) {
    if (calculateDailyCompletion(sorted[i]).isFullyCompleted) {
      current++;
    } else {
      break;
    }
  }

  return {

    current,

    longest,

    completedDays: completed,

    completionRate:
      Math.round(
        (completed / sorted.length) *
          100
      ),

  };

}