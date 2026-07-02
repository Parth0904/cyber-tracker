import { NextResponse } from "next/server";

import {
  getEntries,
} from "@/lib/repositories/dailyEntries";

import {
  getActivities,
} from "@/lib/repositories/activities";

import {
  generateHistoryTimeline,
  generateHistorySummary,
} from "@/lib/history";

export async function GET() {

  const entries =
    getEntries("all");

  const activities =
    getActivities("all");

  const history =
    generateHistoryTimeline(
      entries,
      activities
    );

  const summary =
    generateHistorySummary(
      history
    );

  return NextResponse.json(summary);

}