import { NextRequest, NextResponse } from "next/server";
import { getWeeklyReview } from "@/lib/repositories/weeklyReview";
import { generateWeeklyReviewReport } from "@/lib/services/weeklyReview";

type RouteParams = {
  params: Promise<{
    year: string;
    week: string;
  }>;
};

// GET: Serves the weekly review. Auto-generates and caches if not already present.
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { year, week } = await params;
    const yearNum = Number(year);
    const weekNum = Number(week);

    if (isNaN(yearNum) || isNaN(weekNum)) {
      return NextResponse.json({ error: "Invalid year or week number" }, { status: 400 });
    }

    const saved = await getWeeklyReview(yearNum, weekNum);
    
    if (saved) {
      const report = JSON.parse(saved.report_json);
      return NextResponse.json({ success: true, report });
    }

    // Auto-compile and save on the fly if there's no saved report yet
    const report = await generateWeeklyReviewReport(yearNum, weekNum);
    return NextResponse.json({ success: true, report });
  } catch (err) {
    console.error("Fetch weekly review failed:", err);
    return NextResponse.json(
      { error: "Failed to load weekly review", details: String(err) },
      { status: 500 }
    );
  }
}

// POST: Force recalculation and overwrite cache
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { year, week } = await params;
    const yearNum = Number(year);
    const weekNum = Number(week);

    if (isNaN(yearNum) || isNaN(weekNum)) {
      return NextResponse.json({ error: "Invalid year or week number" }, { status: 400 });
    }

    const report = await generateWeeklyReviewReport(yearNum, weekNum);
    return NextResponse.json({ success: true, report, message: "Review regenerated successfully." });
  } catch (err) {
    console.error("Regenerate weekly review failed:", err);
    return NextResponse.json(
      { error: "Failed to regenerate weekly review", details: String(err) },
      { status: 500 }
    );
  }
}
