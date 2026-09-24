import { ActivityType } from "./constants";

export type ActivityRow = {
  date: string;
  type: ActivityType;
  count: number;
  created_at?: string;
};

export type DailyEntry = {
  date: string;
  notes: string;
  focus_feeling?: string | null;
  steps?: number;
  // Legacy / historical database fields (preserved for schema compatibility, decoupled from active tracker)
  reading?: number | null;
  workout?: number | null;
  sleep_hours?: number | null;
  bed_time?: string | null;
  wake_time?: string | null;
  mobile_screen_time?: number | null;
};