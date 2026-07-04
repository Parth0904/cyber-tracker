import { NextResponse } from "next/server";

import {
  getAllDailyEntries,
} from "@/lib/repositories/dailyEntries";

import {
  getAllActivities,
} from "@/lib/repositories/activities";

import {
  buildReportSummary,
} from "@/lib/reports";

import {
  generateWeeklyReport,
} from "@/lib/reports";

import {
  generateMonthlyReport,
} from "@/lib/reports";

import {
  generateYearlyReport,
} from "@/lib/reports";
import { generateRecommendations } from "@/lib/reports/recommendations";

export async function GET(){

const entries =
getAllDailyEntries();

const activities =
getAllActivities();

const summary =
buildReportSummary(
entries,
activities
);

const yearly =
  generateYearlyReport(
    summary
  );

const monthly =
  generateMonthlyReport(
    summary
  );

  const recommendations =
  generateRecommendations(
    monthly
  );

const weekly =
  generateWeeklyReport(summary);

return NextResponse.json({

summary,
weekly,
monthly,
yearly,
recommendations,
});

}