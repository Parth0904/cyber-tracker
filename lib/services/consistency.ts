import { getAllDailyEntries } from "@/lib/repositories/dailyEntries";
import { getAllSessions } from "@/lib/repositories/targetSessions";
import { getAllLearningSessions } from "@/lib/repositories/learning";
import { getAllActivities } from "@/lib/repositories/activities";
import { getAllFindings } from "@/lib/repositories/targetFindings";
import { getParentReportConfig } from "@/lib/repositories/parentReport";
import { getConsistencyCache, setConsistencyCache } from "@/lib/services/cache";

export type ConsistencyResult = {
  state: "green" | "amber" | "red";
  score: number;
};

export function formatDateInTimezone(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const yyyy = parts.find(p => p.type === "year")?.value;
  const mm = parts.find(p => p.type === "month")?.value;
  const dd = parts.find(p => p.type === "day")?.value;
  return `${yyyy}-${mm}-${dd}`;
}

export function calculateConsistencyForPeriod(
  dates: string[],
  entries: any[],
  targetSessions: any[],
  learningSessions: any[],
  activities: any[],
  findings: any[],
  timezone: string
): number {
  let coreRecoverySum = 0;
  let workoutSum = 0;
  let productiveSum = 0;

  for (const dateStr of dates) {
    const entry = entries.find((e) => e.date === dateStr);

    const sleepSet = entry?.bed_time ? 1 : 0;
    const wakeTimeSet = entry?.wake_time ? 1 : 0;
    const readingSet = entry?.reading ? 1 : 0;
    const noScreenSet = (entry?.mobile_screen_time !== null && entry?.mobile_screen_time !== undefined) ? 1 : 0;

    const coreRecoveryRate = (sleepSet + wakeTimeSet + readingSet + noScreenSet) / 4;
    coreRecoverySum += coreRecoveryRate;

    const workoutSet = entry?.workout ? 1 : 0;
    workoutSum += workoutSet;

    // Productive session checks
    const hasTargetSession = targetSessions.some((s) => {
      if (!s.started_at) return false;
      const localDateStr = formatDateInTimezone(new Date(s.started_at), timezone);
      return localDateStr === dateStr;
    });

    const hasLearningSession = learningSessions.some((s) => {
      if (!s.started_at) return false;
      const localDateStr = formatDateInTimezone(new Date(s.started_at), timezone);
      return localDateStr === dateStr;
    });

    const hasActivity = activities.some((a) => {
      return a.date === dateStr && ["learning", "bug_report", "recon", "target", "finding"].includes(a.type);
    });

    const hasFinding = findings.some((f) => {
      if (!f.submitted_at) return false;
      const localDateStr = formatDateInTimezone(new Date(f.submitted_at), timezone);
      return localDateStr === dateStr;
    });

    const isProductiveDay = hasTargetSession || hasLearningSession || hasActivity || hasFinding ? 1 : 0;
    productiveSum += isProductiveDay;
  }

  const avgCoreRecoveryRate = coreRecoverySum / 7;
  const avgWorkoutRate = workoutSum / 7;
  const avgProductiveRate = productiveSum / 7;

  return Math.round(
    (avgCoreRecoveryRate * 0.4 +
      avgWorkoutRate * 0.15 +
      avgProductiveRate * 0.45) *
      100
  );
}

export async function calculateConsistency(): Promise<ConsistencyResult> {
  const cached = getConsistencyCache();
  if (cached) {
    return cached.data;
  }

  try {
    const [
      allEntries,
      targetSessions,
      learningSessions,
      activities,
      findings,
      config
    ] = await Promise.all([
      getAllDailyEntries(),
      getAllSessions(),
      getAllLearningSessions(),
      getAllActivities(),
      getAllFindings(),
      getParentReportConfig()
    ]);

    // Insufficient historical data checks: need at least 5 logged daily entries overall
    if (allEntries.length < 5) {
      const result: ConsistencyResult = { state: "red", score: 0 };
      setConsistencyCache(result);
      return result;
    }

    const timezone = config.time_zone || "UTC";

    // Generate dates for the last 7 calendar days in target timezone
    const dates: string[] = [];
    const nowLocal = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(nowLocal.getTime() - i * 24 * 60 * 60 * 1000);
      dates.push(formatDateInTimezone(d, timezone));
    }

    const score = calculateConsistencyForPeriod(
      dates,
      allEntries,
      targetSessions,
      learningSessions,
      activities,
      findings,
      timezone
    );

    let state: "green" | "amber" | "red" = "red";
    if (score >= 75) {
      state = "green";
    } else if (score >= 40) {
      state = "amber";
    }

    const result: ConsistencyResult = { state, score };
    setConsistencyCache(result);
    return result;
  } catch (err) {
    console.error("Consistency engine calculation fault:", err);
    return { state: "red", score: 0 };
  }
}
