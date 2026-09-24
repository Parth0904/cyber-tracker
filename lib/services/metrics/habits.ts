/**
 * Canonical Habit Metrics Service
 * 
 * Central source of truth for:
 * - Daily Log & Historical Entry definitions
 * - Reading and Workout are legacy historical fields and do NOT contribute to any active score
 */

export interface HabitEntryLike {
  workout?: number | null;
  reading?: number | null;
  notes?: string | null;
  [key: string]: any;
}

export interface HabitCounts {
  workoutDays: number;
  readingDays: number;
  notesDays: number;
  totalDays: number;
}

/**
 * Historical helper for workout entry presence.
 * Does NOT contribute to any active performance score.
 */
export function isWorkoutCompleted(entry: HabitEntryLike | null | undefined): boolean {
  if (!entry) return false;
  return Boolean(entry.workout && entry.workout > 0);
}

/**
 * Historical helper for reading entry presence.
 * Does NOT contribute to any active performance score.
 */
export function isReadingCompleted(entry: HabitEntryLike | null | undefined): boolean {
  if (!entry) return false;
  return Boolean(entry.reading && entry.reading > 0);
}

/**
 * Authoritative check for whether daily log was recorded.
 * Note: Daily log is purely informational and optional.
 */
export function isNotesLogged(entry: HabitEntryLike | null | undefined): boolean {
  if (!entry) return false;
  return Boolean(entry.notes && entry.notes.trim().length > 0);
}

/**
 * Historical habit counts across daily entries.
 */
export function getHabitCounts(entries: HabitEntryLike[]): HabitCounts {
  let workoutDays = 0;
  let readingDays = 0;
  let notesDays = 0;

  for (const e of entries) {
    if (isWorkoutCompleted(e)) workoutDays++;
    if (isReadingCompleted(e)) readingDays++;
    if (isNotesLogged(e)) notesDays++;
  }

  return {
    workoutDays,
    readingDays,
    notesDays,
    totalDays: entries.length,
  };
}

/**
 * Canonical habit compliance rate across a period.
 * Reading and workout no longer penalize or contribute to active compliance.
 */
export function getHabitComplianceRate(entries: HabitEntryLike[]): number {
  if (entries.length === 0) return 0;
  return 100;
}
