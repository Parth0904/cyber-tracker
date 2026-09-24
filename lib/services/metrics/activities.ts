/**
 * Canonical Activities & Productive Day Service
 * 
 * Central source of truth for:
 * - Productive day determination (isProductiveDay)
 * - Productive days count over any period
 * - Activity breakdown by type
 */

import { APP_TIMEZONE, formatDateInTimezone } from "./dates";

export interface ProductiveDayData {
  targetSessions?: Array<{ started_at?: string | null }>;
  learningSessions?: Array<{ started_at?: string | null }>;
  activities?: Array<{ date: string; type: string; count?: number }>;
  findings?: Array<{ submitted_at?: string | null }>;
}

export const PRODUCTIVE_ACTIVITY_TYPES = [
  "learning",
  "bug_report",
  "recon",
  "target",
  "finding",
] as const;

/**
 * Single authoritative determination of whether a given calendar date was productive.
 * A day is productive if it has at least one target session, learning session,
 * qualifying productive activity, or submitted finding in the user's timezone.
 */
export function isProductiveDay(
  dateStr: string,
  data: ProductiveDayData,
  timezone = APP_TIMEZONE
): boolean {
  const hasTarget = Boolean(
    data.targetSessions?.some((s) => {
      if (!s.started_at) return false;
      const local = formatDateInTimezone(new Date(s.started_at), timezone);
      return local === dateStr;
    })
  );

  if (hasTarget) return true;

  const hasLearning = Boolean(
    data.learningSessions?.some((s) => {
      if (!s.started_at) return false;
      const local = formatDateInTimezone(new Date(s.started_at), timezone);
      return local === dateStr;
    })
  );

  if (hasLearning) return true;

  const hasActivity = Boolean(
    data.activities?.some((a) => {
      return (
        a.date === dateStr &&
        (PRODUCTIVE_ACTIVITY_TYPES as readonly string[]).includes(a.type)
      );
    })
  );

  if (hasActivity) return true;

  const hasFinding = Boolean(
    data.findings?.some((f) => {
      if (!f.submitted_at) return false;
      const local = formatDateInTimezone(new Date(f.submitted_at), timezone);
      return local === dateStr;
    })
  );

  return hasFinding;
}

/**
 * Single authoritative count of productive days across a given array of date strings.
 */
export function getProductiveDaysCount(
  dates: string[],
  data: ProductiveDayData,
  timezone = APP_TIMEZONE
): number {
  let count = 0;
  for (const dateStr of dates) {
    if (isProductiveDay(dateStr, data, timezone)) {
      count++;
    }
  }
  return count;
}

/**
 * Returns a count map of activities by type.
 */
export function getActivityCountsByType(
  activities: Array<{ type: string; count?: number }>
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const act of activities) {
    counts[act.type] = (counts[act.type] || 0) + (act.count ?? 1);
  }
  return counts;
}
