import { NextResponse } from "next/server";
import { getTodayEntry } from "@/lib/repositories/dailyEntries";
import { calculateConsistency } from "@/lib/services/metrics/consistency";
import { APP_TIMEZONE, getTodayDateString } from "@/lib/services/metrics/dates";
import { getPerformanceOverview } from "@/lib/services/metrics/performance";
import { getDailyStudyTarget } from "@/lib/services/metrics/dailyTarget";
import { getPerformanceMentorOverview } from "@/lib/services/metrics/performanceMentor";

export async function GET() {
  const today = getTodayDateString(APP_TIMEZONE);
  const entry = (await getTodayEntry(today)) || null;

  // 1. Calculate dynamic consistency
  const consistencyInfo = await calculateConsistency();

  // 2. Canonical performance overview, daily target & performance mentor
  const [performanceInfo, dailyTargetInfo, mentorInfo] = await Promise.all([
    getPerformanceOverview(),
    getDailyStudyTarget(),
    getPerformanceMentorOverview(),
  ]);

  return NextResponse.json({
    completion: {
      percent: dailyTargetInfo.today.completionPercentage,
      completedHours: dailyTargetInfo.today.completedHours,
      targetHours: dailyTargetInfo.targetHours,
      remainingHours: dailyTargetInfo.today.remainingHours,
      entry: {
        notes: entry?.notes || "",
      },
    },
    consistency: consistencyInfo,
    performance: {
      ...performanceInfo,
      dailyTarget: dailyTargetInfo,
    },
    dailyTarget: dailyTargetInfo,
    mentor: mentorInfo,
  });
}