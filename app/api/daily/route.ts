import {
  getTodayEntry,
  saveDailyEntry,
} from "@/lib/repositories/dailyEntries";
import { NextResponse } from "next/server";
import { mapDailyFormToEntry } from "@/lib/mappers/dailyEntry";
import { APP_TIMEZONE, getTodayDateString } from "@/lib/services/metrics/dates";

export async function GET() {
  const today = getTodayDateString(APP_TIMEZONE);
  const entry = await getTodayEntry(today);
  return NextResponse.json(entry || {});
}

export async function POST(req: Request) {
  const body = await req.json();
  const date = body.date || getTodayDateString(APP_TIMEZONE);

  await saveDailyEntry(
    mapDailyFormToEntry(
      date,
      body
    )
  );

  return NextResponse.json({
    success: true,
  });
}