import { NextResponse } from "next/server";
import { getEntries } from "@/lib/repositories/dailyEntries";
import { getActivities } from "@/lib/repositories/activities";
import { generateHistoryTimeline } from "@/lib/history";

export async function GET() {
  const entries = await getEntries("all");
  const activities = await getActivities("all");
  const history = generateHistoryTimeline(entries, activities);

  return NextResponse.json(history);
}