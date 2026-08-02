import { NextRequest, NextResponse } from "next/server";
import { getISOWeek, getISOWeekYear, subWeeks } from "date-fns";
import { getAllWeeklyReviews, saveWeeklyReview } from "@/lib/repositories/weeklyReview";
import { getAllDailyEntries } from "@/lib/repositories/dailyEntries";
import { getAllSessions } from "@/lib/repositories/targetSessions";
import { getAllLearningSessions } from "@/lib/repositories/learning";
import { generateWeeklyReviewReport, getDatesForWeek } from "@/lib/services/weeklyReview";

// GET: Returns lists of all generated and available (can be generated) historical weeks
export async function GET() {
  try {
    const [
      savedReviews,
      dailyEntries,
      targetSessions,
      learningSessions,
    ] = await Promise.all([
      getAllWeeklyReviews(),
      getAllDailyEntries(),
      getAllSessions(),
      getAllLearningSessions(),
    ]);

    // Construct a set of all unique year-week combinations in the database
    const availableWeeksSet = new Set<string>();

    const addDateToWeeks = (dateStr?: string | null) => {
      if (!dateStr) return;
      try {
        const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00Z`);
        if (isNaN(d.getTime())) return;
        const w = getISOWeek(d);
        const y = getISOWeekYear(d);
        availableWeeksSet.add(`${y}-${w}`);
      } catch {}
    };

    dailyEntries.forEach(e => addDateToWeeks(e.date));
    targetSessions.forEach(s => addDateToWeeks(s.started_at));
    learningSessions.forEach(s => addDateToWeeks(s.started_at));

    // Map into lists
    const reviews = Array.from(availableWeeksSet).map(key => {
      const [year, week] = key.split("-").map(Number);
      const saved = savedReviews.find(r => r.year === year && r.week_number === week);
      
      const { start, end } = getDatesForWeek(year, week);
      const startDateStr = start.toISOString().split("T")[0];
      const endDateStr = end.toISOString().split("T")[0];

      if (saved) {
        let parsedReport: any = null;
        try {
          parsedReport = JSON.parse(saved.report_json);
        } catch {}
        
        return {
          year,
          week,
          startDate: startDateStr,
          endDate: endDateStr,
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
          startDate: startDateStr,
          endDate: endDateStr,
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
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    
    // Default to the week that just ended (1 week ago from current time)
    const today = new Date();
    const lastWeekDate = subWeeks(today, 1);
    const targetWeek = getISOWeek(lastWeekDate);
    const targetYear = getISOWeekYear(lastWeekDate);
    
    const report = await generateWeeklyReviewReport(targetYear, targetWeek);
    
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
