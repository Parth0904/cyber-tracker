import { DailyEntry } from "@/lib/types";

export type DailyForm = {
  notes?: string;
  workout?: boolean;
  reading?: boolean;
};

export function mapDailyFormToEntry(
  date: string,
  form: DailyForm
): DailyEntry {
  return {
    date,
    focus_feeling: null,
    steps: 0,
    notes: form.notes ?? "",
  };
}