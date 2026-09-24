import { NextRequest, NextResponse } from "next/server";
import { generateMonthlyReport } from "@/lib/services/reporting/monthlyReport";
import { APP_TIMEZONE } from "@/lib/services/metrics/dates";

export async function GET(
  _: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      year: string;
      month: string;
    }>;
  }
) {
  try {
    const { year, month } = await params;
    const yearNum = Number(year);
    const monthNum = Number(month);

    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return NextResponse.json({ error: "Invalid year parameter" }, { status: 400 });
    }

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json({ error: "Invalid month parameter" }, { status: 400 });
    }

    const report = await generateMonthlyReport(yearNum, monthNum, APP_TIMEZONE);
    return NextResponse.json(report);
  } catch (err) {
    console.error("Monthly review generation fault:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
