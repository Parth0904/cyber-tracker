import { DailyEntry } from "@/lib/types";

export type Streak = {
  current: number;
  longest: number;
  completedDays: number;
  completionRate: number;
};

function isCompleted(entry: DailyEntry) {
  let score = 0;

  if (entry.sleep_hours >= 7) score++;
  if (entry.reading >= 30) score++;
  if (entry.workout) score++;
  if (entry.steps >= 8000) score++;
  if (entry.bed_time) score++;
  if (entry.focus_feeling) score++;

  return score >= 5;
}

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

    if (isCompleted(entry)) {

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

    if (isCompleted(sorted[i])) {

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