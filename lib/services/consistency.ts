import { getAllDailyEntries } from "@/lib/repositories/dailyEntries";
import { getAllWorkTimeDaily } from "@/lib/repositories/workTimeDaily";
import { getConsistencyCache, setConsistencyCache } from "@/lib/services/cache";

export type ConsistencyResult = {
  state: "green" | "amber" | "red";
  score: number;
};

export { formatDateInTimezone, APP_TIMEZONE } from "@/lib/services/metrics/dates";
import { APP_TIMEZONE, getRollingDateRange } from "@/lib/services/metrics/dates";
import { getProductiveDaysCount } from "@/lib/services/metrics/activities";

export function calculateConsistencyForPeriod(
  dates: string[],
  _entries: any[],
  targetSessions: any[],
  learningSessions: any[],
  activities: any[],
  findings: any[],
  timezone = APP_TIMEZONE
): number {
  const productiveSum = getProductiveDaysCount(
    dates,
    { targetSessions, learningSessions, activities, findings },
    timezone
  );

  const totalDays = dates.length || 1;
  const avgProductiveRate = productiveSum / totalDays;

  // Reading and Workout are decoupled; consistency is 100% driven by productive cybersecurity work
  return Math.round(avgProductiveRate * 100);
}

export async function calculateConsistency(): Promise<ConsistencyResult> {
  const cached = getConsistencyCache();
  if (cached) {
    return cached.data;
  }

  try {
    const [allEntries, workRecords] = await Promise.all([
      getAllDailyEntries(),
      getAllWorkTimeDaily()
    ]);

    // Insufficient historical data checks: need at least 5 logged records overall
    if (allEntries.length < 5 && workRecords.length < 5) {
      const result: ConsistencyResult = { state: "red", score: 0 };
      setConsistencyCache(result);
      return result;
    }

    // Generate dates for the last 7 calendar days in Asia/Kolkata
    const dates = getRollingDateRange(7, APP_TIMEZONE).dates;
    const workDatesWithTime = new Set(
      workRecords.filter((r) => r.active_seconds > 0).map((r) => r.date)
    );

    const productiveDays = dates.filter((d) => workDatesWithTime.has(d)).length;
    const score = Math.round((productiveDays / (dates.length || 1)) * 100);

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
