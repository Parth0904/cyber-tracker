import { DailyEntry } from "@/lib/types";

type DailyForm = {
  sleep: number;
  bedTime: string;
  reading: boolean;
  focusFeeling: number;
  workout: boolean;
  steps: number;
  notes: string;
};

const focusMap = {
  1: "Distracted",
  2: "Focused",
  3: "Deep",
  4: "Flow State",
} as const;

export function mapDailyFormToEntry(
  date: string,
  form: DailyForm
): DailyEntry {

  return {

    date,

    sleep_hours: form.sleep,

    bed_time: form.bedTime,

    reading: form.reading ? 1 : 0,

    focus_feeling:
      focusMap[
        form.focusFeeling as keyof typeof focusMap
      ],

    workout: form.workout ? 1 : 0,

    steps: form.steps,

    notes: form.notes ?? "",

  };

}