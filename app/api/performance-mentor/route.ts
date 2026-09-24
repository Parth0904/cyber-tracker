import { NextRequest, NextResponse } from "next/server";
import { getPerformanceMentorOverview } from "@/lib/services/metrics/performanceMentor";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const simulateDaysOffParam = searchParams.get("simulateDaysOff");
    const periodParam = searchParams.get("period")?.toLowerCase();

    let simulateWeeklyDaysOff: number | undefined;
    let simulateMonthlyDaysOff: number | undefined;

    if (simulateDaysOffParam !== null) {
      const days = parseInt(simulateDaysOffParam, 10);
      if (!isNaN(days) && days >= 0) {
        if (periodParam === "monthly") {
          simulateMonthlyDaysOff = days;
        } else {
          simulateWeeklyDaysOff = days;
        }
      }
    }

    const mentorOverview = await getPerformanceMentorOverview({
      simulateWeeklyDaysOff,
      simulateMonthlyDaysOff,
    });

    return NextResponse.json(mentorOverview);
  } catch (err) {
    console.error("Failed to compile performance mentor telemetry:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const days = typeof body.simulateDaysOff === "number" ? body.simulateDaysOff : parseInt(body.simulateDaysOff, 10);
    const period = body.period?.toLowerCase();

    let simulateWeeklyDaysOff: number | undefined;
    let simulateMonthlyDaysOff: number | undefined;

    if (!isNaN(days) && days >= 0) {
      if (period === "monthly") {
        simulateMonthlyDaysOff = days;
      } else {
        simulateWeeklyDaysOff = days;
      }
    }

    const mentorOverview = await getPerformanceMentorOverview({
      simulateWeeklyDaysOff,
      simulateMonthlyDaysOff,
    });

    return NextResponse.json(mentorOverview);
  } catch (err) {
    console.error("Failed to simulate time-off in performance mentor:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
