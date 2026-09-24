/**
 * Canonical Comparison Metrics Service
 * 
 * Central source of truth for:
 * - Comparisons against previous period (week-over-week)
 * - Comparisons against 30-day historical baseline
 * - Score delta calculations
 */

export interface ComparisonMetric {
  thisWeekValue: number;
  prevWeekValue: number;
  prevWeekDiffPercent: number;
  avg30dValue: number;
  avg30dDiffPercent: number;
}

/**
 * Builds comparison metrics for quantitative values (hours, reports, sessions).
 * Differences are expressed as percentage changes.
 */
export function buildComparisonMetric(
  thisVal: number,
  prevVal: number,
  avg30dVal: number
): ComparisonMetric {
  const prevWeekDiffPercent =
    prevVal === 0
      ? thisVal > 0
        ? 100
        : 0
      : Math.round(((thisVal - prevVal) / prevVal) * 100);

  const avg30dDiffPercent =
    avg30dVal === 0
      ? thisVal > 0
        ? 100
        : 0
      : Math.round(((thisVal - avg30dVal) / avg30dVal) * 100);

  return {
    thisWeekValue: Math.round(thisVal * 10) / 10,
    prevWeekValue: Math.round(prevVal * 10) / 10,
    prevWeekDiffPercent,
    avg30dValue: Math.round(avg30dVal * 10) / 10,
    avg30dDiffPercent,
  };
}

/**
 * Builds comparison metrics for percentage/score values (such as consistency).
 * Differences are expressed as raw score point differences.
 */
export function buildScoreComparisonMetric(
  thisScore: number,
  prevScore: number,
  avg30dScore: number
): ComparisonMetric {
  return {
    thisWeekValue: Math.round(thisScore),
    prevWeekValue: Math.round(prevScore),
    prevWeekDiffPercent: Math.round(thisScore - prevScore),
    avg30dValue: Math.round(avg30dScore),
    avg30dDiffPercent: Math.round(thisScore - avg30dScore),
  };
}
