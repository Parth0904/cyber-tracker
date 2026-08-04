import { DailyEntry } from "@/lib/types";

export type DailyForm = {
  bedTime: string;
  wakeTime: string;
  workout: boolean;
  reading: boolean;
  notes: string;
  mobileScreenTime: number | null;
};

export function calculateSleepHours(bedTime: string, wakeTime: string): number {
  if (!bedTime || !wakeTime) return 0;

  const [bedH, bedM] = bedTime.split(":").map(Number);
  const [wakeH, wakeM] = wakeTime.split(":").map(Number);

  if (isNaN(bedH) || isNaN(bedM) || isNaN(wakeH) || isNaN(wakeM)) return 0;

  const bedMinutes = bedH * 60 + bedM;
  const wakeMinutes = wakeH * 60 + wakeM;

  let diffMinutes = wakeMinutes - bedMinutes;
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60; // crossover midnight
  }

  return Math.round((diffMinutes / 60) * 10) / 10;
}

export function mapDailyFormToEntry(
  date: string,
  form: DailyForm
): DailyEntry {
  return {
    date,
    sleep_hours: calculateSleepHours(form.bedTime, form.wakeTime),
    bed_time: form.bedTime,
    wake_time: form.wakeTime,
    reading: form.reading ? 1 : 0,
    focus_feeling: null,
    workout: form.workout ? 1 : 0,
    steps: 0,
    notes: form.notes ?? "",
    mobile_screen_time: form.mobileScreenTime,
  };
}