/**
 * Step 5: Dynamic Daily Study Target Engine Verification Script
 * Validates weekly recovery, monthly fallback, daily ideal, recovery ceiling (10h max),
 * recovery horizon extension, actual hour preservation, calendar denominators,
 * period boundaries (Sunday/Monday, month-end/month-start, IST midnight), and stability.
 */

import {
  calculateDailyStudyTarget,
} from "../lib/services/metrics/dailyTarget";
import {
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

console.log("=== STEP 5: DYNAMIC DAILY STUDY TARGET ENGINE VALIDATION ===\n");

// -------------------------------------------------------------
// Test 1: Weekly Recovery - 30h completed, 2 days remaining
// Required pace: (42 - 30) / 2 = 6h/day -> target = 6h, source = WEEKLY
// -------------------------------------------------------------
console.log("--- 1. Weekly Recovery: 30h completed, 2 days remaining ---");
const test1 = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-19", // Saturday (2 days remaining: Sat, Sun)
  weekly: {
    completedHours: 30.0,
    remainingDays: 2,
    targetHours: 42.0,
  },
  monthly: {
    completedHours: 100.0,
    remainingDays: 12,
    targetHours: 180.0,
  },
});
assert(test1.targetHours === 6.0, "Test 1: Target hours is 6.0h");
assert(test1.targetSource === "WEEKLY", "Test 1: Target source is WEEKLY");
assert(test1.reason === "WEEKLY_RECOVERY", "Test 1: Reason is WEEKLY_RECOVERY");
assert(test1.weekly.remainingHours === 12.0, "Test 1: Weekly remaining hours is 12.0h");
assert(test1.weekly.requiredDailyPace === 6.0, "Test 1: Required daily pace is 6.0h/day");
assert(test1.weekly.secured === false, "Test 1: Weekly target is NOT yet secured");
assert(test1.recovery.extended === false, "Test 1: Recovery is not extended (<= 10h ceiling)");

// -------------------------------------------------------------
// Test 2: Weekly Recovery - 40h completed, 2 days remaining
// Required pace: (42 - 40) / 2 = 1h/day -> target = 1h, source = WEEKLY
// -------------------------------------------------------------
console.log("\n--- 2. Weekly Recovery: 40h completed, 2 days remaining ---");
const test2 = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-19",
  weekly: {
    completedHours: 40.0,
    remainingDays: 2,
    targetHours: 42.0,
  },
  monthly: {
    completedHours: 100.0,
    remainingDays: 12,
    targetHours: 180.0,
  },
});
assert(test2.targetHours === 1.0, "Test 2: Target hours is 1.0h");
assert(test2.targetSource === "WEEKLY", "Test 2: Target source is WEEKLY");
assert(test2.reason === "WEEKLY_RECOVERY", "Test 2: Reason is WEEKLY_RECOVERY");
assert(test2.weekly.remainingHours === 2.0, "Test 2: Weekly remaining hours is 2.0h");
assert(test2.weekly.requiredDailyPace === 1.0, "Test 2: Required daily pace is 1.0h/day");
assert(test2.weekly.secured === false, "Test 2: Weekly target is NOT yet secured");

// -------------------------------------------------------------
// Test 3: Weekly transition - 42h completed
// Weekly secured -> engine evaluates monthly
// -------------------------------------------------------------
console.log("\n--- 3. Weekly transition: 42h completed (Weekly secured) ---");
const test3 = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-19",
  weekly: {
    completedHours: 42.0,
    remainingDays: 2,
    targetHours: 42.0,
  },
  monthly: {
    completedHours: 100.0,
    remainingDays: 12,
    targetHours: 180.0,
  },
});
assert(test3.weekly.secured === true, "Test 3: Weekly target is secured");
assert(test3.weekly.remainingHours === 0, "Test 3: Weekly remaining hours is 0");
assert(test3.targetSource === "MONTHLY", "Test 3: Engine evaluated monthly as active driver");
assert(test3.reason === "MONTHLY_RECOVERY", "Test 3: Reason is MONTHLY_RECOVERY");

// -------------------------------------------------------------
// Test 4: Monthly fallback - Weekly secured + monthly requires 5.5h/day
// target = 5.5h, source = MONTHLY
// (e.g. 30-day month, target 180h, completed 125h, 10 days remaining -> (180 - 125) / 10 = 5.5h/day)
// -------------------------------------------------------------
console.log("\n--- 4. Monthly fallback: Weekly secured + monthly requires 5.5h/day ---");
const test4 = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-21",
  weekly: {
    completedHours: 42.0,
    remainingDays: 7,
    targetHours: 42.0,
  },
  monthly: {
    completedHours: 125.0,
    remainingDays: 10,
    targetHours: 180.0,
  },
});
assert(test4.targetHours === 5.5, "Test 4: Target hours is 5.5h");
assert(test4.targetSource === "MONTHLY", "Test 4: Target source is MONTHLY");
assert(test4.reason === "MONTHLY_RECOVERY", "Test 4: Reason is MONTHLY_RECOVERY");
assert(test4.monthly.requiredDailyPace === 5.5, "Test 4: Monthly required pace is 5.5h/day");
assert(test4.recovery.extended === false, "Test 4: Recovery is not extended (<= 10h ceiling)");

// -------------------------------------------------------------
// Test 5: Daily Ideal fallback - Weekly and monthly both secured
// target = 8h, source = DAILY_IDEAL
// -------------------------------------------------------------
console.log("\n--- 5. Daily Ideal fallback: Weekly and monthly both secured ---");
const test5 = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-21",
  weekly: {
    completedHours: 45.0,
    remainingDays: 7,
    targetHours: 42.0,
  },
  monthly: {
    completedHours: 182.0,
    remainingDays: 10,
    targetHours: 180.0,
  },
});
assert(test5.targetHours === 8.0, "Test 5: Target hours is 8.0h (Daily Ideal)");
assert(test5.targetSource === "DAILY_IDEAL", "Test 5: Target source is DAILY_IDEAL");
assert(test5.reason === "MONTHLY_SECURED", "Test 5: Reason is MONTHLY_SECURED");
assert(test5.weekly.secured === true, "Test 5: Weekly is secured");
assert(test5.monthly.secured === true, "Test 5: Monthly is secured");
assert(test5.recovery.extended === false, "Test 5: Recovery is not extended");

// -------------------------------------------------------------
// Test 6: Recovery ceiling - Mathematical requirement = 16h/day
// Target MUST NOT exceed 10h. Recovery must be extended. Projected date must exist.
// (e.g. 42h target, 10h completed, 2 days left -> (42 - 10) / 2 = 16h/day)
// -------------------------------------------------------------
console.log("\n--- 6. Recovery Ceiling: Math requirement = 16h/day ---");
const test6 = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-18",
  weekly: {
    completedHours: 10.0,
    remainingDays: 2,
    targetHours: 42.0,
  },
  monthly: {
    completedHours: 50.0,
    remainingDays: 12,
    targetHours: 180.0,
  },
});
assert(test6.weekly.requiredDailyPace === 16.0, "Test 6: Math required pace is 16.0h/day");
assert(test6.targetHours === 10.0, "Test 6: Target MUST NOT exceed 10.0h planning ceiling");
assert(test6.targetHours <= REALISTIC_MAX_DAILY_SESSION_HOURS, "Test 6: Target <= REALISTIC_MAX_DAILY_SESSION_HOURS");
assert(test6.recovery.extended === true, "Test 6: Recovery horizon is marked extended");
assert(test6.recovery.additionalDays > 0, "Test 6: Additional recovery days > 0");
assert(test6.recovery.projectedRecoveryDate !== null, "Test 6: Projected recovery date exists");
// Deficit = 32 - (2 * 6) = 20h. At 4h/day surplus, ceil(20 / 4) = 5 days.
assert(test6.recovery.additionalDays === 5, "Test 6: Additional recovery days = 5 days");
assert(test6.recovery.projectedRecoveryDate === "2026-09-23", "Test 6: Projected recovery date is 2026-09-23 (2026-09-18 + 5 days)");

// -------------------------------------------------------------
// Test 7: Actual hours - 12h actually recorded
// Engine uses 12h as actual completed work, NEVER modifies it to 10h
// -------------------------------------------------------------
console.log("\n--- 7. Actual hours: 12h actually recorded ---");
const test7 = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-15",
  allSessions: [
    { duration: 720, started_at: "2026-09-14T08:00:00+05:30" }, // 12h Monday
  ],
  weekly: {
    startDateStr: "2026-09-14",
    endDateStr: "2026-09-20",
  },
  monthly: {
    startDateStr: "2026-09-01",
    endDateStr: "2026-09-30",
  },
});
assert(test7.weekly.completedHours === 12.0, "Test 7: Weekly completed hours is 12.0h (unclamped)");
assert(test7.monthly.completedHours === 12.0, "Test 7: Monthly completed hours is 12.0h (unclamped)");

// -------------------------------------------------------------
// Test 8: Calendar - Weekly denominator remains 7 (42h Green target)
// -------------------------------------------------------------
console.log("\n--- 8. Calendar: Weekly denominator remains 7 (42h target) ---");
const test8 = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-14", // Monday
});
assert(test8.weekly.targetHours === 42.0, "Test 8: Weekly target is 7 * 6h = 42.0h");
assert(test8.weekly.remainingDays === 7, "Test 8: On Monday, remaining days in week is 7");

// -------------------------------------------------------------
// Test 9: Calendar - Monthly denominator remains actual calendar days
// September has 30 days -> 30 * 6 = 180h target
// October has 31 days -> 31 * 6 = 186h target
// February 2024 has 29 days -> 29 * 6 = 174h target
// -------------------------------------------------------------
console.log("\n--- 9. Calendar: Monthly denominator remains actual calendar days ---");
const test9Sept = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-01",
});
assert(test9Sept.monthly.targetHours === 180.0, "Test 9: September (30 days) target is 180.0h");
assert(test9Sept.monthly.remainingDays === 30, "Test 9: September 1st remaining days is 30");

const test9Oct = calculateDailyStudyTarget({
  asOfDateStr: "2026-10-01",
});
assert(test9Oct.monthly.targetHours === 186.0, "Test 9: October (31 days) target is 186.0h (31 * 6h)");
assert(test9Oct.monthly.remainingDays === 31, "Test 9: October 1st remaining days is 31");

// -------------------------------------------------------------
// Test 10: Boundaries - Sunday -> Monday transition
// On Sunday: remainingDays = 1, period ends today
// On Monday: new week starts, remainingDays = 7
// -------------------------------------------------------------
console.log("\n--- 10. Boundaries: Sunday -> Monday transition ---");
const sundayTest = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-20", // Sunday
  weekly: {
    completedHours: 36.0,
  },
});
assert(sundayTest.weekly.remainingDays === 1, "Test 10 (Sunday): remainingDays = 1");
assert(sundayTest.targetHours === 6.0, "Test 10 (Sunday): (42 - 36) / 1 = 6.0h target");

const mondayTest = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-21", // Monday (new week)
  weekly: {
    completedHours: 0.0,
  },
});
assert(mondayTest.weekly.remainingDays === 7, "Test 10 (Monday): new week begins, remainingDays = 7");
assert(mondayTest.targetHours === 6.0, "Test 10 (Monday): 42 / 7 = 6.0h target");

// -------------------------------------------------------------
// Test 11: Boundaries - Month-end -> Month-start transition
// On Sep 30: remainingDays = 1
// On Oct 01: remainingDays = 31
// -------------------------------------------------------------
console.log("\n--- 11. Boundaries: Month-end -> Month-start transition ---");
const monthEndTest = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-30",
});
assert(monthEndTest.monthly.remainingDays === 1, "Test 11 (Month-End Sep 30): remainingDays = 1");

const monthStartTest = calculateDailyStudyTarget({
  asOfDateStr: "2026-10-01",
});
assert(monthStartTest.monthly.remainingDays === 31, "Test 11 (Month-Start Oct 01): remainingDays = 31");

// -------------------------------------------------------------
// Test 12: Boundaries - IST midnight boundary
// Asia/Kolkata UTC+05:30: 2026-09-17T23:59:00+05:30 is 2026-09-17,
// 2026-09-18T00:01:00+05:30 is 2026-09-18
// -------------------------------------------------------------
console.log("\n--- 12. Boundaries: IST midnight boundary ---");
const d1 = formatDateInTimezone("2026-09-17T23:59:00+05:30", APP_TIMEZONE);
const d2 = formatDateInTimezone("2026-09-18T00:01:00+05:30", APP_TIMEZONE);
assert(d1 === "2026-09-17", "Test 12: 23:59 IST correctly resolves to 2026-09-17");
assert(d2 === "2026-09-18", "Test 12: 00:01 IST correctly resolves to 2026-09-18");

// Session just before IST midnight counts towards 2026-09-17
const test12Target17 = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-17",
  allSessions: [
    { duration: 180, started_at: "2026-09-17T23:30:00+05:30" }
  ],
});
assert(test12Target17.weekly.completedHours === 3.0, "Test 12: 23:30 session counted in 2026-09-17");

// -------------------------------------------------------------
// Test 13: Stability - Weekly Green target secured -> monthly becomes active recovery
// -------------------------------------------------------------
console.log("\n--- 13. Stability: Weekly secured -> monthly becomes active recovery ---");
const test13 = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-17",
  weekly: {
    completedHours: 43.0, // Secured!
    remainingDays: 4,
    targetHours: 42.0,
  },
  monthly: {
    completedHours: 120.0, // (180 - 120) / 14 = 4.29h/day
    remainingDays: 14,
    targetHours: 180.0,
  },
});
assert(test13.weekly.secured === true, "Test 13: Weekly is secured");
assert(test13.targetSource === "MONTHLY", "Test 13: Target source is MONTHLY");
assert(test13.targetHours === 4.29, "Test 13: Target is monthly pace 4.29h/day");
assert(test13.reason === "MONTHLY_RECOVERY", "Test 13: Reason is MONTHLY_RECOVERY");

// -------------------------------------------------------------
// Test 14: Stability - Both secured -> falls back to 8h daily ideal
// -------------------------------------------------------------
console.log("\n--- 14. Stability: Both secured -> falls back to 8h daily ideal ---");
const test14 = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-17",
  weekly: {
    completedHours: 50.0, // Secured!
    remainingDays: 4,
    targetHours: 42.0,
  },
  monthly: {
    completedHours: 190.0, // Secured!
    remainingDays: 14,
    targetHours: 180.0,
  },
});
assert(test14.weekly.secured === true, "Test 14: Weekly is secured");
assert(test14.monthly.secured === true, "Test 14: Monthly is secured");
assert(test14.targetSource === "DAILY_IDEAL", "Test 14: Target source is DAILY_IDEAL");
assert(test14.targetHours === 8.0, "Test 14: Target is 8.0h (Daily Ideal)");
assert(test14.reason === "MONTHLY_SECURED", "Test 14: Reason is MONTHLY_SECURED");

console.log("\n🎉 ALL 14 TEST SCENARIOS PASSED WITH 100% SUCCESS!");
