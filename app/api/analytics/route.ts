import { NextRequest, NextResponse } from "next/server";

import {
  getEntries,
  getTodayEntry,
} from "@/lib/repositories/dailyEntries";

import {
  getActivities,
} from "@/lib/repositories/activities";

import {
  generateSummary,
  generateScoreTrend,
  generateActivityDistribution,
  generateHabitRanking,
  generatePeriodReport,
  generateMilestones,
  generatePersonalRecords,
  generateHeatmap,
} from "@/lib/analytics";

import { buildStatistics } from "@/lib/analytics/statistics";

import { generateInsights } from "@/lib/insights";

import {
  DailyEntry,
} from "@/lib/types";

import {
  TimeRange,
} from "@/lib/types/analytics";

export async function GET(
  req: NextRequest
) {

  const range =
    (req.nextUrl.searchParams.get(
      "range"
    ) ?? "all") as TimeRange;

  const dailyEntries =
    getEntries(range);

  const activities =
    getActivities(range);

  const statistics =
    buildStatistics(
      dailyEntries,
      activities
    );

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const defaultEntry: DailyEntry = {
    date: today,
    sleep_hours: 0,
    bed_time: "",
    reading: 0,
    focus_feeling: "",
    workout: 0,
    steps: 0,
    notes: "",
  };

  const todayEntry =
    getTodayEntry(today) ??
    defaultEntry;

  const {
    insights,
  } = generateInsights(
    dailyEntries,
    activities,
    todayEntry
  );

  return NextResponse.json({

    range,

    summary:
      generateSummary(
        statistics
      ),

    scoreTrend:
      generateScoreTrend(
        activities
      ),

    activityDistribution:
      generateActivityDistribution(
        activities
      ),

    habitRanking:
      generateHabitRanking(
        insights
      ),

    report:
      generatePeriodReport(
        statistics,
        range
      ),

    milestones:
      generateMilestones(
        activities
      ),

    personalRecords:
      generatePersonalRecords(
        statistics,
        dailyEntries
      ),

    heatmap:
      generateHeatmap(
        statistics
      ),

  });

}