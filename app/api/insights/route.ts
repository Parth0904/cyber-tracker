import { NextRequest, NextResponse } from "next/server";
import { getPerformanceOverview } from "@/lib/services/metrics/performance";
import {
  calculateHolidayCapacity,
  simulateHolidayRecovery,
  HolidaySimulationInput,
} from "@/lib/services/holiday/holidayIntelligence";
import { APP_TIMEZONE } from "@/lib/services/metrics/dates";

export async function GET() {
  try {
    const overview = await getPerformanceOverview();
    const monthWorkHours = overview.currentMonth.performance.totalProductiveHours;

    const capacity = calculateHolidayCapacity({
      workHours: monthWorkHours,
      timezone: APP_TIMEZONE,
    });

    return NextResponse.json(capacity);
  } catch (err) {
    console.error("Failed compiling holiday capacity payload:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: HolidaySimulationInput = await req.json();

    // If current productive hours not provided, calculate from canonical performance overview
    if (body.currentProductiveHours === undefined) {
      const overview = await getPerformanceOverview(body.timezone || APP_TIMEZONE);
      const cap = calculateHolidayCapacity({
        workHours: overview.currentMonth.performance.totalProductiveHours,
        timezone: body.timezone || APP_TIMEZONE,
      });
      body.currentProductiveHours = cap.totalProductiveHours;
      body.elapsedWorkdays = cap.elapsedWorkdays;
    }

    const simulation = simulateHolidayRecovery(body);
    return NextResponse.json(simulation);
  } catch (err) {
    console.error("Failed executing holiday recovery simulation:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}