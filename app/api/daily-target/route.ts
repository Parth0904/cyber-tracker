import { NextResponse } from "next/server";
import { getDailyStudyTarget } from "@/lib/services/metrics/dailyTarget";

export async function GET() {
  try {
    const target = await getDailyStudyTarget();
    return NextResponse.json({
      ...target,
      // Canonical direct properties
      todayTargetHours: target.targetHours,
      todayProductiveHours: target.today.completedHours,
      remainingHours: target.today.remainingHours,
      completionPercentage: target.today.completionPercentage,
      weeklyStatus: target.weekly.status,
      monthlyStatus: target.monthly.status,
      weekendRecoveryRequired: target.weekendRecovery.required,
      recoveryWorkdays: target.weekendRecovery.recoveryWorkdays,
    });
  } catch (err) {
    console.error("Failed to calculate canonical daily study target:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
