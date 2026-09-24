import { NextResponse } from "next/server";
import { compileHistoricalAnalytics } from "@/lib/services/analytics/historicalAnalytics";
import { APP_TIMEZONE } from "@/lib/services/metrics/dates";

export async function GET() {
  try {
    const payload = await compileHistoricalAnalytics(APP_TIMEZONE);
    return NextResponse.json(payload);
  } catch (err) {
    console.error("Failed to compile historical analytics payload:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}