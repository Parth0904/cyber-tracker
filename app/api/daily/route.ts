import {
  getTodayEntry,
  saveDailyEntry,
} from "@/lib/repositories/dailyEntries";
import { NextResponse } from "next/server";
import { mapDailyFormToEntry } from "@/lib/mappers/dailyEntry";

export async function GET() {
    const today = new Date().toISOString().split("T")[0];

    const entry =
  getTodayEntry(today);

    return NextResponse.json(entry || {});
}

export async function POST(req: Request) {
  const body = await req.json();

  const today =
    new Date().toISOString().split("T")[0];

saveDailyEntry(
  mapDailyFormToEntry(
    today,
    body
  )
);

  return NextResponse.json({
    success: true,
  });
}