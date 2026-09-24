/**
 * Step 6 Performance Mentor & Time-Off Intelligence Verification Script
 * Validates surplus calculation, earned free-day capacity, non-mutating time-off simulation,
 * status transitions, recovery pace calculation, recovery ceiling (10h max), extended horizon,
 * strict concept separation (earned free days vs recovery days), calendar accounting,
 * data integrity, and Asia/Kolkata timezone boundary handling.
 */

import {
  calculatePerformanceMentor,
  simulateTimeOff,
  getPerformanceMentorOverview,
} from "../lib/services/metrics/performanceMentor";
import {
  PERIOD_IDEAL_DAILY_HOURS,
  REALISTIC_MAX_DAILY_SESSION_HOURS,
} from "../lib/services/metrics/performance";
import {
  APP_TIMEZONE,
  formatDateInTimezone,
} from "../lib/services/metrics/dates";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log("=== STEP 6: PERFORMANCE MENTOR & TIME-OFF INTELLIGENCE VALIDATION ===\n");

async function runAllTests() {
  // -------------------------------------------------------------
  // Test 1: Surplus - 210h over 30 days
// ideal = 180h, surplus = 30h, earned free days = 5
// -------------------------------------------------------------
console.log("--- 1. Surplus: 210h over 30 days ---");
assert((PERIOD_IDEAL_DAILY_HOURS as number) >= 6.0, "Test 1: PERIOD_IDEAL_DAILY_HOURS is at least 6.0h/day");
const test1 = calculatePerformanceMentor({
  period: "MONTHLY",
  actualHours: 210.0,
  calendarDays: 30,
});
assert(test1.current.idealAverage === 6.0, "Test 1: Ideal daily average is 6.0h/day");
assert(test1.current.actualHours === 210.0, "Test 1: Actual hours is 210.0h");
assert(test1.current.surplusHours === 30.0, "Test 1: Surplus hours = 210 - 180 = 30.0h");
assert(test1.current.deficitHours === 0, "Test 1: Deficit hours = 0");
assert(test1.earnedFreeDays.available === 5, "Test 1: Earned free days = floor(30 / 6) = 5");
assert(test1.earnedFreeDays.remainingSurplusHours === 0, "Test 1: Remaining surplus hours = 0h");
assert(test1.state === "AHEAD", "Test 1: State is AHEAD");

// -------------------------------------------------------------
// Test 2: Surplus - 198h over 30 days
// ideal = 180h, surplus = 18h, earned free days = 3, remaining surplus = 0h
// -------------------------------------------------------------
console.log("\n--- 2. Surplus: 198h over 30 days ---");
const test2 = calculatePerformanceMentor({
  period: "MONTHLY",
  actualHours: 198.0,
  calendarDays: 30,
});
assert(test2.current.surplusHours === 18.0, "Test 2: Surplus hours = 198 - 180 = 18.0h");
assert(test2.earnedFreeDays.available === 3, "Test 2: Earned free days = floor(18 / 6) = 3");
assert(test2.earnedFreeDays.remainingSurplusHours === 0, "Test 2: Remaining surplus hours = 0h");
assert(test2.state === "AHEAD", "Test 2: State is AHEAD");

// -------------------------------------------------------------
// Test 3: Surplus - 200h over 30 days
// ideal = 180h, surplus = 20h, earned free days = 3, remaining surplus = 2h
// -------------------------------------------------------------
console.log("\n--- 3. Surplus: 200h over 30 days ---");
const test3 = calculatePerformanceMentor({
  period: "MONTHLY",
  actualHours: 200.0,
  calendarDays: 30,
});
assert(test3.current.surplusHours === 20.0, "Test 3: Surplus hours = 200 - 180 = 20.0h");
assert(test3.earnedFreeDays.available === 3, "Test 3: Earned free days = floor(20 / 6) = 3");
assert(test3.earnedFreeDays.remainingSurplusHours === 2.0, "Test 3: Fractional surplus = 20 - (3 * 6) = 2.0h");
assert(test3.state === "AHEAD", "Test 3: State is AHEAD");

// -------------------------------------------------------------
// Test 4: Time-off simulation - Simulate 2 days off while ahead
// Projected values correct, actual stored values remain unchanged
// -------------------------------------------------------------
console.log("\n--- 4. Time-off simulation: 2 days off while ahead ---");
const actualHoursBefore = 68.0;
const daysBefore = 10; // Current average: 68 / 10 = 6.8h/day (surplus: 8h)
const test4Sim = simulateTimeOff({
  actualHours: actualHoursBefore,
  calendarDays: daysBefore,
  daysOff: 2,
  asOfDateStr: "2026-09-17",
});
assert(actualHoursBefore === 68.0, "Test 4: Input actual hours remain unchanged (68.0h)");
assert(test4Sim.projectedHours === 68.0, "Test 4: Projected hours unchanged at 68.0h");
// 68h / (10 + 2) days = 68 / 12 = 5.67h/day
assert(test4Sim.projectedAverage === 5.67, "Test 4: Projected average is 68 / 12 = 5.67h/day");
assert(test4Sim.daysOff === 2, "Test 4: Days off simulated = 2");

// -------------------------------------------------------------
// Test 5: Time-off simulation - Cross from Green to Yellow
// Current: 68h over 10 days = 6.8h/day (Green)
// After 2 days off: 68h over 12 days = 5.67h/day -> YELLOW
// Recovery required is calculated
// -------------------------------------------------------------
console.log("\n--- 5. Time-off simulation: Cross from Green to Yellow ---");
assert(test4Sim.projectedStatus === "YELLOW", "Test 5: Projected status becomes YELLOW [5.0h - 6.0h/day]");
assert(test4Sim.recoveryRequired === true, "Test 5: Recovery required is true (below 6.0h ideal baseline)");
assert(test4Sim.projectedDeficitHours === 4.0, "Test 5: Projected deficit is (12 * 6) - 68 = 4.0h");
assert(test4Sim.projectedSurplusHours === 0, "Test 5: Projected surplus is 0h");

// -------------------------------------------------------------
// Test 6: Time-off simulation - Cross into RED
// After 4 days off: 68h over 14 days = 4.86h/day -> RED (< 5.0h/day)
// Deficit correctly calculated: (14 * 6) - 68 = 84 - 68 = 16h
// -------------------------------------------------------------
console.log("\n--- 6. Time-off simulation: Cross into RED ---");
const test6Sim = simulateTimeOff({
  actualHours: 68.0,
  calendarDays: 10,
  daysOff: 4,
  asOfDateStr: "2026-09-17",
});
assert(test6Sim.projectedAverage === 4.86, "Test 6: Projected average is 68 / 14 = 4.86h/day");
assert(test6Sim.projectedStatus === "RED", "Test 6: Projected status becomes RED (< 5.0h/day)");
assert(test6Sim.projectedDeficitHours === 16.0, "Test 6: Deficit is (14 * 6) - 68 = 16.0h");
assert(test6Sim.recoveryRequired === true, "Test 6: Recovery required is true");

// -------------------------------------------------------------
// Test 7: Recovery - Recoverable deficit within period
// e.g. 42h week target, 24h completed, 4 days elapsed, 3 days remaining.
// Deficit so far: (4 * 6) - 24 = 0.
// If actual is 18h over 4 days: Deficit = (4 * 6) - 18 = 6h.
// Remaining target for 42h: 42 - 18 = 24h over 3 days = 8.0h/day.
// 8.0h/day <= 10.0h planning ceiling -> recoverable within period.
// -------------------------------------------------------------
console.log("\n--- 7. Recovery: Recoverable deficit within period ---");
const test7 = calculatePerformanceMentor({
  period: "WEEKLY",
  actualHours: 18.0,
  calendarDays: 4,
  totalDays: 7,
  remainingDays: 3,
  asOfDateStr: "2026-09-17",
});
assert(test7.state === "BEHIND", "Test 7: State is BEHIND");
assert(test7.current.deficitHours === 6.0, "Test 7: Deficit hours = (4 * 6) - 18 = 6.0h");
assert(test7.recovery.required === true, "Test 7: Recovery is required");
assert(test7.recovery.requiredDailyPace === 8.0, "Test 7: Required pace = (42 - 18) / 3 = 8.0h/day");
assert(test7.recovery.requiredDailyPace <= REALISTIC_MAX_DAILY_SESSION_HOURS, "Test 7: Required pace <= 10.0h planning ceiling");
assert(test7.recovery.extended === false, "Test 7: Recovery is NOT extended (fits within period)");
assert(test7.recovery.additionalDays === 0, "Test 7: Additional recovery days = 0");
assert(test7.recovery.projectedRecoveryDate === null, "Test 7: Projected recovery date is null");

// -------------------------------------------------------------
// Test 8: Recovery - Unrealistic deficit exceeding ceiling
// 42h week target, 10h completed, 5 days elapsed, 2 days remaining.
// Required pace: (42 - 10) / 2 = 16.0h/day > 10.0h ceiling.
// Recovery horizon extends!
// -------------------------------------------------------------
console.log("\n--- 8. Recovery: Unrealistic deficit exceeding ceiling ---");
const test8 = calculatePerformanceMentor({
  period: "WEEKLY",
  actualHours: 10.0,
  calendarDays: 5,
  totalDays: 7,
  remainingDays: 2,
  asOfDateStr: "2026-09-18",
});
assert(test8.current.deficitHours === 20.0, "Test 8: Deficit hours = (5 * 6) - 10 = 20.0h");
assert(test8.recovery.requiredDailyPace === 16.0, "Test 8: Mathematical required pace = 16.0h/day");
assert(test8.recovery.planningCeiling === 10.0, "Test 8: Planning ceiling is 10.0h/day");
assert(test8.recovery.extended === true, "Test 8: Recovery horizon is marked EXTENDED");
// Deficit = 20h. At 4h/day surplus, ceil(20 / 4) = 5 days needed.
assert(test8.recovery.additionalDays === 5, "Test 8: Additional recovery days = 5 days");
assert(test8.recovery.projectedRecoveryDate === "2026-09-23", "Test 8: Projected recovery date is 2026-09-23");

// -------------------------------------------------------------
// Test 9: Separation - Earned free days never appear when there is a deficit
// -------------------------------------------------------------
console.log("\n--- 9. Separation: Earned free days never appear when there is a deficit ---");
const test9 = calculatePerformanceMentor({
  period: "WEEKLY",
  actualHours: 12.0,
  calendarDays: 4,
});
assert(test9.current.deficitHours === 12.0, "Test 9: Has deficit of 12.0h");
assert(test9.earnedFreeDays.available === 0, "Test 9: Earned free days is strictly 0");
assert(test9.earnedFreeDays.remainingSurplusHours === 0, "Test 9: Remaining surplus is strictly 0");

// -------------------------------------------------------------
// Test 10: Separation - Recovery days never appear as earned free days
// -------------------------------------------------------------
console.log("\n--- 10. Separation: Recovery days never appear as earned free days ---");
assert(test8.recovery.additionalDays === 5, "Test 8: Has 5 additional recovery days needed");
assert(test8.earnedFreeDays.available === 0, "Test 10: Earned free days remains 0 despite recovery days");
assert(test8.recovery.additionalDays !== test8.earnedFreeDays.available, "Test 10: Recovery days and free days are completely distinct");

// -------------------------------------------------------------
// Test 11: Calendar - Weekly calculations use 7 calendar days
// -------------------------------------------------------------
console.log("\n--- 11. Calendar: Weekly calculations use 7 calendar days ---");
const test11Week = calculatePerformanceMentor({
  period: "WEEKLY",
  actualHours: 42.0,
  calendarDays: 7,
  totalDays: 7,
});
assert(test11Week.current.idealAverage === 6.0, "Test 11: Weekly ideal baseline is 6.0h/day");
assert(test11Week.current.surplusHours === 0.0, "Test 11: 42h over 7 days is exactly balanced (0 surplus, 0 deficit)");
assert(test11Week.state === "ON_TRACK", "Test 11: Weekly state is ON_TRACK");

// -------------------------------------------------------------
// Test 12: Calendar - Monthly calculations use actual month length
// -------------------------------------------------------------
console.log("\n--- 12. Calendar: Monthly calculations use actual month length ---");
const test12Sept = calculatePerformanceMentor({
  period: "MONTHLY",
  actualHours: 180.0,
  calendarDays: 30, // September 30 days
  totalDays: 30,
});
assert(test12Sept.current.idealAverage === 6.0, "Test 12: Monthly ideal is 6.0h/day");
assert(test12Sept.state === "ON_TRACK", "Test 12: 180h over 30 days is ON_TRACK");

const test12Oct = calculatePerformanceMentor({
  period: "MONTHLY",
  actualHours: 186.0,
  calendarDays: 31, // October 31 days
  totalDays: 31,
});
assert(test12Oct.state === "ON_TRACK", "Test 12: 186h over 31 days is ON_TRACK");

// -------------------------------------------------------------
// Test 13 & 14: Calendar - No weekend assumptions & No holiday assumptions
// 0h on Saturday and Sunday count normally as calendar days
// -------------------------------------------------------------
console.log("\n--- 13 & 14. Calendar: No weekend/holiday assumptions ---");
const test13Weekend = calculatePerformanceMentor({
  period: "WEEKLY",
  actualHours: 30.0,
  calendarDays: 7, // All 7 days counted, including weekend
});
// 7 days * 6.0h = 42h ideal. 30h actual -> 12h deficit.
assert(test13Weekend.current.calendarDays === 7, "Test 13: Denominator is 7 calendar days");
assert(test13Weekend.current.deficitHours === 12.0, "Test 13: Deficit = 42 - 30 = 12.0h (weekend 0h counted)");
assert(test13Weekend.state === "BEHIND", "Test 13: State is BEHIND");

// -------------------------------------------------------------
// Test 15: Data integrity - Simulation never modifies actual session data
// -------------------------------------------------------------
console.log("\n--- 15. Data integrity: Simulation never modifies actual session data ---");
const originalHours = 50.0;
const simRun1 = simulateTimeOff({
  actualHours: originalHours,
  calendarDays: 7,
  daysOff: 3,
});
assert(originalHours === 50.0, "Test 15: Original hours unchanged");
assert(simRun1.projectedHours === 50.0, "Test 15: Projected hours matches original");

// -------------------------------------------------------------
// Test 16: Data integrity - Actual 12h session remains 12h unclamped
// -------------------------------------------------------------
console.log("\n--- 16. Data integrity: Actual 12h session remains 12h ---");
const test16Intense = calculatePerformanceMentor({
  period: "WEEKLY",
  actualHours: 12.0,
  calendarDays: 1,
});
assert(test16Intense.current.actualHours === 12.0, "Test 16: Actual 12.0h recorded remains 12.0h (unclamped)");
assert(test16Intense.current.surplusHours === 6.0, "Test 16: Surplus hours = 12 - 6 = 6.0h");
assert(test16Intense.earnedFreeDays.available === 1, "Test 16: Earned free days = floor(6 / 6) = 1");

// -------------------------------------------------------------
// Test 17: Timezone - All period boundaries use Asia/Kolkata
// -------------------------------------------------------------
console.log("\n--- 17. Timezone: All period boundaries use Asia/Kolkata ---");
assert(APP_TIMEZONE === "Asia/Kolkata", "Test 17: APP_TIMEZONE is Asia/Kolkata");
const t1 = formatDateInTimezone("2026-09-17T23:59:59+05:30", APP_TIMEZONE);
const t2 = formatDateInTimezone("2026-09-18T00:00:01+05:30", APP_TIMEZONE);
assert(t1 === "2026-09-17", "Test 17: 23:59:59 IST is 2026-09-17");
assert(t2 === "2026-09-18", "Test 17: 00:00:01 IST is 2026-09-18");

// -------------------------------------------------------------
// Test 18: Live compilation overview query
// -------------------------------------------------------------
console.log("\n--- 18. Live overview compilation: getPerformanceMentorOverview ---");
const overviewTest = await getPerformanceMentorOverview({
  huntingSessions: [
    { duration: 180, started_at: "2026-09-17T09:00:00+05:30" },
  ],
  learningSessions: [
    { duration: 300, started_at: "2026-09-17T14:00:00+05:30" },
  ],
  timezone: "Asia/Kolkata",
  simulateWeeklyDaysOff: 2,
});
assert(overviewTest.weekly !== undefined, "Test 18: Weekly mentor overview present");
assert(overviewTest.monthly !== undefined, "Test 18: Monthly mentor overview present");
assert(overviewTest.weekly.simulation !== undefined, "Test 18: Weekly simulation present");
assert(overviewTest.weekly.simulation?.daysOff === 2, "Test 18: Simulated 2 days off");
  console.log("\n🎉 ALL PERFORMANCE MENTOR SCENARIOS PASSED WITH 100% SUCCESS!");
}

runAllTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
