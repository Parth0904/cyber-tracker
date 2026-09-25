import { NextResponse } from "next/server";
import { getTodayEntry } from "@/lib/repositories/dailyEntries";
import { calculateConsistency } from "@/lib/services/metrics/consistency";
import { APP_TIMEZONE, getTodayDateString } from "@/lib/services/metrics/dates";
import { getMonthCalendar } from "@/lib/services/calendar/monthlyCalendar";

export async function GET() {
  try {
    const today = getTodayDateString(APP_TIMEZONE);
    const [year, month] = today.split("-").map(Number);

    const [entry, consistencyInfo, calendar] = await Promise.all([
      getTodayEntry(today),
      calculateConsistency(),
      getMonthCalendar(year, month, today, APP_TIMEZONE),
    ]);

    const todayDay = calendar.days.find((d) => d.date === today);
    const targetHours = todayDay?.plannedAllocationHours ?? 8.0;
    const completedHours = todayDay?.actualWorkHours ?? 0.0;
    const remainingHours = Math.max(0, Math.round((targetHours - completedHours) * 10) / 10);
    const percent = targetHours > 0 ? Math.round((completedHours / targetHours) * 1000) / 10 : 0;

    return NextResponse.json({
      success: true,
      calendar,
      today: todayDay,
      completion: {
        percent,
        completedHours,
        targetHours,
        remainingHours,
        entry: {
          notes: entry?.notes || "",
        },
      },
      consistency: consistencyInfo,
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load dashboard" },
      { status: 500 }
    );
  }
}