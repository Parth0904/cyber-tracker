import { getAllDailyEntries } from "@/lib/repositories/dailyEntries";
import { getAllSessions } from "@/lib/repositories/targetSessions";

export type ConsistencyResult = {
  state: "green" | "amber" | "red";
  score: number;
};

export async function calculateConsistency(): Promise<ConsistencyResult> {
  try {
    const allEntries = await getAllDailyEntries();

    // Insufficient historical data checks: need at least 5 logged daily entries overall
    if (allEntries.length < 5) {
      return { state: "red", score: 0 };
    }

    // Generate dates for the last 7 calendar days in UTC format (matching daily log entries)
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }

    const sessions = await getAllSessions();

    let habitSum = 0;
    let workoutSum = 0;
    let readingSum = 0;
    let loggingSum = 0;
    let sessionSum = 0;

    for (const dateStr of dates) {
      const entry = allEntries.find((e) => e.date === dateStr);

      const bedTimeSet = entry?.bed_time ? 1 : 0;
      const wakeTimeSet = entry?.wake_time ? 1 : 0;
      const workoutSet = entry?.workout ? 1 : 0;
      const readingSet = entry?.reading ? 1 : 0;
      const logSet = entry?.notes && entry.notes.trim() !== "" ? 1 : 0;

      const completedHabits = bedTimeSet + wakeTimeSet + workoutSet + readingSet + logSet;
      const habitRate = completedHabits / 5;

      habitSum += habitRate;
      workoutSum += workoutSet;
      readingSum += readingSet;
      loggingSum += logSet;

      // Check if there was at least one session on this date
      const hasSession = sessions.some(
        (s) => s.started_at && s.started_at.startsWith(dateStr)
      );
      sessionSum += hasSession ? 1 : 0;
    }

    const avgHabitRate = habitSum / 7;
    const avgWorkoutRate = workoutSum / 7;
    const avgReadingRate = readingSum / 7;
    const avgLoggingRate = loggingSum / 7;
    const avgSessionRate = sessionSum / 7;

    // Deterministic formula mapping inputs to score
    const score = Math.round(
      (avgHabitRate * 0.4 +
        avgWorkoutRate * 0.15 +
        avgReadingRate * 0.15 +
        avgLoggingRate * 0.15 +
        avgSessionRate * 0.15) *
        100
    );

    let state: "green" | "amber" | "red" = "red";
    if (score >= 75) {
      state = "green";
    } else if (score >= 40) {
      state = "amber";
    }

    return { state, score };
  } catch (err) {
    console.error("Consistency engine calculation fault:", err);
    return { state: "red", score: 0 };
  }
}
