import { getAllDailyEntries } from "@/lib/repositories/dailyEntries";
import { getAllSessions } from "@/lib/repositories/targetSessions";
import { getAllLearningSessions } from "@/lib/repositories/learning";
import { getAllActivities } from "@/lib/repositories/activities";
import { getAllFindings } from "@/lib/repositories/targetFindings";

export type ConsistencyResult = {
  state: "green" | "amber" | "red";
  score: number;
};

export async function calculateConsistency(): Promise<ConsistencyResult> {
  try {
    const [
      allEntries,
      targetSessions,
      learningSessions,
      activities,
      findings
    ] = await Promise.all([
      getAllDailyEntries(),
      getAllSessions(),
      getAllLearningSessions(),
      getAllActivities(),
      getAllFindings()
    ]);

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

    let coreRecoverySum = 0;
    let workoutSum = 0;
    let productiveSum = 0;

    for (const dateStr of dates) {
      const entry = allEntries.find((e) => e.date === dateStr);

      const sleepSet = entry?.bed_time ? 1 : 0;
      const wakeTimeSet = entry?.wake_time ? 1 : 0;
      const readingSet = entry?.reading ? 1 : 0;
      const noScreenSet = (entry?.mobile_screen_time !== null && entry?.mobile_screen_time !== undefined) ? 1 : 0;

      const coreRecoveryRate = (sleepSet + wakeTimeSet + readingSet + noScreenSet) / 4;
      coreRecoverySum += coreRecoveryRate;

      const workoutSet = entry?.workout ? 1 : 0;
      workoutSum += workoutSet;

      // Productive session checks
      const hasTargetSession = targetSessions.some(
        (s) => s.started_at && s.started_at.split("T")[0] === dateStr
      );
      const hasLearningSession = learningSessions.some(
        (s) => s.started_at && s.started_at.split("T")[0] === dateStr
      );
      const hasActivity = activities.some(
        (a) => a.date === dateStr && ["learning", "bug_report", "recon", "target", "finding"].includes(a.type)
      );
      const hasFinding = findings.some(
        (f) => f.submitted_at && f.submitted_at.startsWith(dateStr)
      );

      const isProductiveDay = hasTargetSession || hasLearningSession || hasActivity || hasFinding ? 1 : 0;
      productiveSum += isProductiveDay;
    }

    const avgCoreRecoveryRate = coreRecoverySum / 7;
    const avgWorkoutRate = workoutSum / 7;
    const avgProductiveRate = productiveSum / 7;

    const score = Math.round(
      (avgCoreRecoveryRate * 0.4 +
        avgWorkoutRate * 0.15 +
        avgProductiveRate * 0.45) *
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
