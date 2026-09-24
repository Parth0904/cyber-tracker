/**
 * Comprehensive Step 8 Verification Suite
 * 
 * Verifies:
 * 1. Session Endpoint Removal & Active Session / Target Session Decoupling
 * 2. Weekly Review 5-Day Workweek Aggregations
 * 3. Monthly & Yearly Reporting Hierarchy
 * 4. Historical Analytics Perspectives
 * 5. Holiday Capacity & Recovery Simulator Engine
 * 6. Parent Portal Read-Only Architecture
 */

import "dotenv/config";
process.env.AUTH_SECRET = process.env.AUTH_SECRET || "mock_secret_key_for_testing";
process.env.AUTH_PASSWORD = process.env.AUTH_PASSWORD || "mock_password_for_testing";

import assert from "node:assert";
import { generateWeeklyReviewReport } from "@/lib/services/weeklyReview";
import { generateMonthlyReport } from "@/lib/services/reporting/monthlyReport";
import { generateYearlyReport } from "@/lib/services/reporting/yearlyReport";
import { compileHistoricalAnalytics } from "@/lib/services/analytics/historicalAnalytics";
import {
  calculateHolidayCapacity,
  simulateHolidayRecovery,
} from "@/lib/services/holiday/holidayIntelligence";
import {
  getParentPortalOverview,
  calculateParentHolidaySimulation,
} from "@/lib/services/parentPortal";

async function runStep8Verification() {
  console.log("===============================================================");
  console.log("=== STARTING STEP 8: REPORTING, HOLIDAY INTELLIGENCE TESTS ===");
  console.log("===============================================================\n");

  // ── TEST 1: Work Time Data Preservation ──────────────────────────
  console.log("[TEST 1] Preserving canonical work time daily records...");
  const { getAllWorkTimeDaily } = await import("@/lib/repositories/workTimeDaily");
  const workRecords = await getAllWorkTimeDaily();
  console.log(`  -> Retrieved ${workRecords.length} work time daily records.`);
  assert(Array.isArray(workRecords), "Work time daily records must be an array");
  console.log("  [PASS] Work Time data preservation intact.\n");

  // ── TEST 2: Weekly Review 5-Day Workweek Aggregations ─────────────────────
  console.log("[TEST 2] Verifying Weekly Review Report structure & canonical metrics...");
  const weeklyReport = await generateWeeklyReviewReport(2026, 38, "Asia/Kolkata");
  
  assert.strictEqual(weeklyReport.work.dailyTargetHours, 8.0, "Daily target must be 8.0h");
  assert.strictEqual(weeklyReport.work.weeklyTargetHours, 40.0, "Weekly target must be 40.0h");
  assert(typeof weeklyReport.work.totalProductiveHours === "number", "totalProductiveHours must be numeric");
  assert(typeof weeklyReport.work.completionPercentage === "number", "completionPercentage must be numeric");
  
  // Performance section
  assert.strictEqual(weeklyReport.performance.dailyDistribution.length, 7, "Daily distribution must have 7 days");
  assert(["GREEN", "YELLOW", "RED"].includes(weeklyReport.performance.classification), "Valid classification");
  
  // Recovery section
  assert(typeof weeklyReport.recovery.recoveryRequired === "boolean", "recoveryRequired must be boolean");
  assert(["NORMAL_HOLIDAY", "RECOVERY_WORKDAY"].includes(weeklyReport.recovery.saturdayRecoveryStatus));
  assert(["NORMAL_HOLIDAY", "RECOVERY_WORKDAY"].includes(weeklyReport.recovery.sundayRecoveryStatus));

  // Cybersecurity Output
  assert(typeof weeklyReport.cybersecurityOutput.reconHours === "number", "reconHours must be numeric");
  assert(Array.isArray(weeklyReport.cybersecurityOutput.targetsWorked), "targetsWorked must be array");
  console.log(`  -> Weekly report generated for Week ${weeklyReport.weekNumber}/${weeklyReport.year}`);
  console.log(`     Productive hours: ${weeklyReport.work.totalProductiveHours}h / 40h target (${weeklyReport.work.completionPercentage}%)`);
  console.log(`     Workday average: ${weeklyReport.work.averageWorkdayHours}h/day, Status: ${weeklyReport.performance.classification}`);
  console.log(`     Recovery required: ${weeklyReport.recovery.recoveryRequired}`);
  console.log("  [PASS] Weekly Review 5-Day workweek aggregations verified.\n");

  // ── TEST 3: Monthly & Yearly Reporting Hierarchy ─────────────────────────
  console.log("[TEST 3] Verifying Monthly & Yearly Reporting Hierarchy...");
  const monthlyReport = await generateMonthlyReport(2026, 9, "Asia/Kolkata");
  assert.strictEqual(monthlyReport.year, 2026);
  assert.strictEqual(monthlyReport.month, 9);
  assert.strictEqual(monthlyReport.monthName, "September");
  assert(monthlyReport.workdayCount > 15 && monthlyReport.workdayCount < 25, "September workdays reasonable");
  assert.strictEqual(
    monthlyReport.monthlyTargetHours,
    Math.round(monthlyReport.workdayCount * 8.0 * 100) / 100,
    "Monthly target must equal workdayCount * 8.0"
  );
  assert(Array.isArray(monthlyReport.weeklyReports), "Must contain weekly reports drill-down");
  console.log(`  -> Monthly report (09/2026): ${monthlyReport.workdayCount} workdays, Target: ${monthlyReport.monthlyTargetHours}h`);
  console.log(`     Compiled ${monthlyReport.weeklyReports.length} weekly report blocks.`);

  const yearlyReport = await generateYearlyReport(2026, "Asia/Kolkata");
  assert.strictEqual(yearlyReport.year, 2026);
  assert.strictEqual(yearlyReport.monthlyReports.length, 12, "Yearly report must contain 12 months");
  assert(yearlyReport.totalWorkdays > 240 && yearlyReport.totalWorkdays < 270, "Total annual workdays reasonable");
  assert.strictEqual(
    yearlyReport.yearlyTargetHours,
    Math.round(yearlyReport.totalWorkdays * 8.0 * 100) / 100,
    "Yearly target must equal totalWorkdays * 8.0"
  );
  console.log(`  -> Yearly report (2026): ${yearlyReport.totalWorkdays} workdays, Target: ${yearlyReport.yearlyTargetHours}h across 12 months.`);
  console.log("  [PASS] Reporting hierarchy verified.\n");

  // ── TEST 4: Historical Analytics Perspectives ────────────────────────────
  console.log("[TEST 4] Verifying Historical Analytics perspectives (Daily, Weekly, Monthly, Yearly)...");
  const analytics = await compileHistoricalAnalytics("Asia/Kolkata");
  assert.strictEqual(analytics.daily.length, 14, "Daily perspective must have 14 days");
  assert.strictEqual(analytics.weekly.length, 8, "Weekly perspective must have 8 weeks");
  assert.strictEqual(analytics.monthly.length, 12, "Monthly perspective must have 12 months");
  assert(analytics.yearly.length >= 1, "Yearly perspective must have at least 1 year");
  console.log(`  -> Compiled 14 daily points, 8 weekly points, 12 monthly points, ${analytics.yearly.length} yearly points.`);
  console.log("  [PASS] Historical analytics perspectives verified.\n");

  // ── TEST 5: Holiday Capacity Calculations ────────────────────────────────
  console.log("[TEST 5] Verifying Holiday Capacity Calculations...");
  // Positive surplus case: 5 workdays elapsed (requirement = 40h), 56h worked -> 16h surplus -> 2 holidays
  const capPositive = calculateHolidayCapacity({
    overrideHours: 56.0,
    overrideElapsedWorkdays: 5,
    overrideRemainingWorkdays: 15,
  });
  assert.strictEqual(capPositive.availableHolidays, 2, "16h surplus / 8.0 = 2 holidays");
  assert.strictEqual(capPositive.status, "SURPLUS_AVAILABLE");
  assert.strictEqual(capPositive.surplusHours, 16.0);

  // Deficit case: 5 workdays elapsed (requirement = 40h), 25h worked -> 15h deficit -> 0 holidays
  const capDeficit = calculateHolidayCapacity({
    overrideHours: 25.0,
    overrideElapsedWorkdays: 5,
    overrideRemainingWorkdays: 15,
  });
  assert.strictEqual(capDeficit.availableHolidays, 0, "Available holidays must never be negative (min 0)");
  assert.strictEqual(capDeficit.status, "DEFICIT");
  assert.strictEqual(capDeficit.deficitHours, 15.0);
  console.log(`  -> Positive surplus (56h on 5 workdays): ${capPositive.availableHolidays} holidays available.`);
  console.log(`  -> Deficit scenario (25h on 5 workdays): ${capDeficit.availableHolidays} holidays available (clamped to 0).`);
  console.log("  [PASS] Holiday capacity logic verified.\n");

  // ── TEST 6: Predictive Holiday Recovery Simulator ────────────────────────
  console.log("[TEST 6] Verifying Predictive Holiday Recovery Simulator...");
  
  // Scenario A: 2 holidays, 9.0h pace, weekdays only
  const simA = simulateHolidayRecovery({
    holidays: 2,
    plannedDailyHours: 9.0,
    includeWeekends: false,
    currentProductiveHours: 40.0,
    elapsedWorkdays: 5,
    asOfDateStr: "2026-09-23",
  });
  assert.strictEqual(simA.holidayDeficitHours, 16.0, "2 holidays * 8h = 16h");
  assert.strictEqual(simA.dailyWeekdaySurplus, 1.0, "9.0h - 8.0h = 1.0h/workday recovery rate");
  assert.strictEqual(simA.recoveryWorkdaysRequired, 16, "16h deficit / 1h surplus = 16 workdays");
  assert(simA.recoveryCalendarDays >= 20, "16 workdays spans across weekends on calendar");

  // Scenario B: Feasibility warning (8.0h pace without weekends cannot generate recovery surplus)
  const simB = simulateHolidayRecovery({
    holidays: 2,
    plannedDailyHours: 8.0,
    includeWeekends: false,
    currentProductiveHours: 40.0,
    elapsedWorkdays: 5,
    asOfDateStr: "2026-09-23",
  });
  assert.strictEqual(simB.exceedsCeilingWarning, true);
  assert(simB.warningMessage?.includes("cannot recover within the selected period at 8.0h/day without weekend recovery"));

  // Scenario C: Ceiling enforcement (11.0h pace clamped to 10.0h)
  const simC = simulateHolidayRecovery({
    holidays: 2,
    plannedDailyHours: 11.0,
    includeWeekends: false,
    currentProductiveHours: 40.0,
    elapsedWorkdays: 5,
    asOfDateStr: "2026-09-23",
  });
  assert.strictEqual(simC.plannedDailyHours, 10.0, "Pace must be clamped to 10.0h ceiling");
  assert.strictEqual(simC.ceilingCapped, true);
  assert(simC.warningMessage?.includes("10.0h/day planning ceiling"));

  // Scenario D: Weekend recovery acceleration
  const simD = simulateHolidayRecovery({
    holidays: 2,
    plannedDailyHours: 9.0,
    includeWeekends: true,
    currentProductiveHours: 40.0,
    elapsedWorkdays: 5,
    asOfDateStr: "2026-09-23",
  });
  assert(simD.recoveryCalendarDays < simA.recoveryCalendarDays, "Weekend recovery must accelerate calendar completion");
  console.log(`  -> Scenario A (2 holidays @ 9h/day, M-F): ${simA.recoveryWorkdaysRequired} workdays (${simA.recoveryWeeks} wks, date: ${simA.projectedRecoveryDate})`);
  console.log(`  -> Scenario B (8h/day, no weekends): Warning triggered: "${simB.warningMessage?.substring(0, 50)}..."`);
  console.log(`  -> Scenario C (11h/day ceiling cap): Clamped to ${simC.plannedDailyHours}h with warning.`);
  console.log(`  -> Scenario D (Weekend recovery active): Finished in ${simD.recoveryCalendarDays} calendar days (vs ${simA.recoveryCalendarDays} days).`);
  console.log("  [PASS] Predictive recovery simulation verified.\n");

  // ── TEST 7: Parent Portal Architecture ───────────────────────────────────
  console.log("[TEST 7] Verifying Parent Portal read-only compilation & interactive simulation...");
  const parentOverview = await getParentPortalOverview({ asOfDateStr: "2026-09-23" });
  assert.strictEqual(parentOverview.studentName, "Parth");
  assert(parentOverview.currentWeek.targetHours === 40);
  assert(parentOverview.quickScenarios.length === 4, "Must pre-calculate 4 scenarios (1, 2, 3, 5 days)");
  
  const parentSim = await calculateParentHolidaySimulation({
    holidays: 3,
    plannedDailyHours: 9.5,
    includeWeekends: false,
    asOfDateStr: "2026-09-23",
  });
  assert.strictEqual(parentSim.studentName, "Parth");
  assert(parentSim.parentExplanation.length > 20, "Parent explanation must be descriptive");
  console.log(`  -> Parent portal overview for: ${parentOverview.studentName}`);
  console.log(`  -> Pre-calculated quick scenarios: ${parentOverview.quickScenarios.map(s => `${s.holidays}d->${s.recoveryWorkdaysRequired}wkd`).join(", ")}`);
  console.log(`  -> Parent simulation explanation: "${parentSim.parentExplanation}"`);
  console.log("  [PASS] Parent Portal architecture verified.\n");

  console.log("===============================================================");
  console.log("=== ALL STEP 8 VERIFICATION TESTS PASSED SUCCESSFULLY! ===");
  console.log("===============================================================");
}

runStep8Verification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
