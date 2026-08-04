import {
  DailyEntry,
} from "@/lib/types";

import {
  PersonalRecord,
} from "@/lib/types/analytics";

import {
  Statistics,
} from "./statistics";

export function generatePersonalRecords(
  statistics: Statistics,
  dailyEntries: DailyEntry[]
): PersonalRecord[] {

  return [

    {
      title: "Highest Score",
      value:
        statistics.highestScore,
    },

    {
      title: "Longest Sleep",
      value: Math.max(
        0,
        ...dailyEntries.map(
          d => d.sleep_hours
        )
      ),
    },

    {
      title: "Most Reading",
      value: Math.max(
        0,
        ...dailyEntries.map(
          d => d.reading
        )
      ),
    },

  ];
}