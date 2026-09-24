import { NextResponse } from "next/server";
import { getAllWeeklyReviews } from "@/lib/repositories/weeklyReview";
import { getAllDailyEntries } from "@/lib/repositories/dailyEntries";
import { getAllWorkTimeDaily } from "@/lib/repositories/workTimeDaily";
import { generateWeeklyReviewReport, getDatesForWeek, getISOWeekUTC, getISOWeekYearUTC } from "@/lib/services/weeklyReview";
import { APP_TIMEZONE, formatDateInTimezone } from "@/lib/services/metrics/dates";

// GET: Returns lists of all generated and available (can be generated) historical weeks
export async function GET() {
  try {
    const [
      savedReviews,
      dailyEntries,
      workRecords
    ] = await Promise.all([
      getAllWeeklyReviews(),
      getAllDailyEntries(),
      getAllWorkTimeDaily()
    ]);

    const timezone = APP_TIMEZONE;

    // Construct a set of all unique year-week combinations in the database
    const availableWeeksSet = new Set<string>();

    const addDateToWeeks = (dateStr?: string | null) => {
      if (!dateStr) return;
      try {
        const localDateStr = dateStr.includes("T")
          ? formatDateInTimezone(new Date(dateStr), timezone)
          : dateStr;
        const parts = localDateStr.split("-").map(Number);
        const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        const w = getISOWeekUTC(d);
        const y = getISOWeekYearUTC(d);
        availableWeeksSet.add(`${y}-${w}`);
      } catch {}
    };

    dailyEntries.forEach(e => addDateToWeeks(e.date));
    workRecords.forEach(r => addDateToWeeks(r.date));

    // Map into lists
    const reviews = Array.from(availableWeeksSet).map(key => {
      const [year, week] = key.split("-").map(Number);
      const saved = savedReviews.find(r => r.year === year && r.week_number === week);
      
      const { startStr, endStr } = getDatesForWeek(year, week, timezone);

      if (saved) {
        let parsedReport: any = null;
        try {
          parsedReport = JSON.parse(saved.report_json);
        } catch {}
        
        return {
          year,
          week,
          startDate: startStr,
          endDate: endStr,
          generated: true,
          created_at: saved.created_at,
          consistencyScore: parsedReport?.executiveSummary?.consistencyScore ?? 0,
          consistencyState: parsedReport?.executiveSummary?.consistencyState ?? "red",
          huntingHours: parsedReport?.workSummary?.totalHuntingHours ?? 0,
          learningHours: parsedReport?.workSummary?.totalLearningHours ?? 0,
        };
      } else {
        return {
          year,
          week,
          startDate: startStr,
          endDate: endStr,
          generated: false,
        };
      }
    });

    // Sort by year & week DESC
    reviews.sort((a, b) => b.year - a.year || b.week - a.week);

    return NextResponse.json({ success: true, reviews });
  } catch (err) {
    console.error("List weekly reviews failed:", err);
    return NextResponse.json(
      { error: "Failed to load reviews list", details: String(err) },
      { status: 500 }
    );
  }
}

// POST: Cron-trigger endpoint to compile the review for the week that just ended
export async function POST() {
  try {
    const timezone = APP_TIMEZONE;

    // Resolve current date in Asia/Kolkata timezone to find the last week
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const parts = formatter.formatToParts(new Date());
    const yearVal = Number(parts.find(p => p.type === "year")?.value);
    const monthVal = Number(parts.find(p => p.type === "month")?.value) - 1;
    const dayVal = Number(parts.find(p => p.type === "day")?.value);
    const localDate = new Date(Date.UTC(yearVal, monthVal, dayVal));

    const lastWeekDate = new Date(localDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const targetWeek = getISOWeekUTC(lastWeekDate);
    const targetYear = getISOWeekYearUTC(lastWeekDate);
    
    const report = await generateWeeklyReviewReport(targetYear, targetWeek, timezone);
    
    return NextResponse.json({
      success: true,
      message: `Weekly review for ${targetYear} Week ${targetWeek} compiled and saved.`,
      report,
    });
  } catch (err) {
    console.error("Cron weekly review compile failed:", err);
    return NextResponse.json(
      { error: "Cron review compile failed", details: String(err) },
      { status: 500 }
    );
  }
}
