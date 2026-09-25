import { NextResponse } from "next/server";
import { getMonthCalendar } from "@/lib/services/calendar/monthlyCalendar";
import { APP_TIMEZONE, getTodayDateString } from "@/lib/services/metrics/dates";

export async function GET() {
  try {
    const todayStr = getTodayDateString(APP_TIMEZONE);
    const [year, month] = todayStr.split("-").map(Number);
    const cal = await getMonthCalendar(year, month, todayStr, APP_TIMEZONE);
    const today = cal.days.find((d) => d.date === todayStr);

    const targetHours = today?.plannedAllocationHours ?? 8.0;
    const completedHours = today?.actualWorkHours ?? 0.0;
    const remainingHours = Math.max(0, Math.round((targetHours - completedHours) * 10) / 10);
    const completionPercentage = targetHours > 0 ? Math.round((completedHours / targetHours) * 1000) / 10 : 0;

    return NextResponse.json({
      date: todayStr,
      plannedStatus: today?.plannedStatus ?? "WORKDAY",
      targetHours,
      todayTargetHours: targetHours,
      todayProductiveHours: completedHours,
      completedHours,
      remainingHours,
      completionPercentage,
      topic: today?.topic ?? null,
      monthlyRequiredHours: cal.monthlyRequiredHours,
      monthlyWorkedHours: cal.actualWorkedHours,
      monthlyRemainingHours: cal.remainingHours,
      requiredDailyPace: cal.requiredDailyPace,
      requiredDailyPaceFormatted: cal.requiredDailyPaceFormatted,
    });
  } catch (err: any) {
    console.error("Daily target route error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
