import { NextRequest, NextResponse } from "next/server";
import { generateYearlyReport } from "@/lib/services/reporting/yearlyReport";
import { APP_TIMEZONE } from "@/lib/services/metrics/dates";

export async function GET(
  _: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      year: string;
    }>;
  }
) {
  try {
    const { year } = await params;
    const yearNum = Number(year);

    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return NextResponse.json({ error: "Invalid year parameter" }, { status: 400 });
    }

    const report = await generateYearlyReport(yearNum, APP_TIMEZONE);
    return NextResponse.json(report);
  } catch (err) {
    console.error("Yearly review generation fault:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
