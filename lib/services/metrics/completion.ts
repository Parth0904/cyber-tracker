/**
 * Canonical Daily Completion Service
 * 
 * Central source of truth for:
 * - Single-day completion status
 * - Reading and Workout have been completely removed from active tracking.
 */

import { HabitEntryLike } from "./habits";

export interface DailyCompletionResult {
  percent: number;
  completedCount: number;
  totalCount: number;
  missingCount: number;
  missing: string[];
  isFullyCompleted: boolean;
}

/**
 * Calculates completion status for a daily entry.
 * Reading and Workout are decoupled and do NOT contribute to any score or missing list.
 */
export function calculateDailyCompletion(
  entry: HabitEntryLike | null | undefined
): DailyCompletionResult {
  if (!entry) {
    return {
      percent: 0,
      completedCount: 0,
      totalCount: 0,
      missingCount: 0,
      missing: [],
      isFullyCompleted: false,
    };
  }

  return {
    percent: 100,
    completedCount: 0,
    totalCount: 0,
    missingCount: 0,
    missing: [],
    isFullyCompleted: true,
  };
}

// Backward-compatible alias
export const calculateCompletion = calculateDailyCompletion;
