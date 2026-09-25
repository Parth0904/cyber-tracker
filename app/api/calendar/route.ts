import { NextRequest, NextResponse } from "next/server";
import { getMonthCalendar } from "@/lib/services/calendar/monthlyCalendar";
import { APP_TIMEZONE, getTodayDateString } from "@/lib/services/metrics/dates";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const todayStr = getTodayDateString(APP_TIMEZONE);
    const [todayYear, todayMonth] = todayStr.split("-").map(Number);

    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : todayYear;
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!, 10) : todayMonth;

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: "Invalid year or month parameter." },
        { status: 400 }
      );
    }

    const calendar = await getMonthCalendar(year, month, todayStr, APP_TIMEZONE);

    return NextResponse.json({
      success: true,
      calendar,
    });
  } catch (error: any) {
    console.error("Failed to load monthly calendar:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load calendar" },
      { status: 500 }
    );
  }
}
