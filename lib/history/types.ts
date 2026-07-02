import { DailyEntry, ActivityRow } from "@/lib/types";
import { Insight } from "@/lib/insights";

export type HistoryDay = {
  date: string;

  score: number;

  completion: number;

  productivity: {
    level: string;
    reason: string[];
    contributors: {
      type: string;
      contribution: number;
    }[];
  };

  daily: DailyEntry;

  activities: Record<ActivityRow["type"], number>;

  focus: Insight | null;

  insights: Insight[];
};

export type HistorySummary = {
  totalDays: number;
  averageScore: number;
  highestScore: number;
  completionRate: number;
};