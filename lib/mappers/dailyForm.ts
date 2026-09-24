import { DailyEntry } from "@/lib/types";

export function mapEntryToDailyForm(
  entry: DailyEntry
) {
  return {
    notes: entry.notes ?? "",
  };
}