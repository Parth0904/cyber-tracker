import { DailyEntry } from "@/lib/types";

export function mapEntryToDailyForm(
  entry: DailyEntry
) {
  return {
    bedTime: entry.bed_time || "",
    wakeTime: entry.wake_time || "",
    workout: Boolean(entry.workout),
    reading: Boolean(entry.reading),
    mobileScreenTime: entry.mobile_screen_time !== undefined && entry.mobile_screen_time !== null ? entry.mobile_screen_time : null,
    notes: entry.notes ?? "",
  };
}