import { DailyEntry } from "@/lib/types";

const reverseFocusMap = {
  "Distracted": 1,
  "Focused": 2,
  "Deep": 3,
  "Flow State": 4,
} as const;

export function mapEntryToDailyForm(
  entry: DailyEntry
) {
  return {

    sleep: entry.sleep_hours,

    bedTime: entry.bed_time,

    reading: Boolean(entry.reading),

    focusFeeling:
      reverseFocusMap[
        entry.focus_feeling as keyof typeof reverseFocusMap
      ] ?? 1,

    workout: Boolean(entry.workout),

    steps: entry.steps,

    notes: entry.notes ?? "",

  };
}