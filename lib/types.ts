import { ActivityType } from "./constants";

export type ActivityRow = {
  date: string;
  type: ActivityType;
  count: number;
  created_at?: string;
};

export type DailyEntry = {
  date: string;
  sleep_hours: number;
  bed_time: string;
  wake_time?: string;
  reading: number;
  focus_feeling: string;
  workout: number;
  steps: number;
  notes: string;
};