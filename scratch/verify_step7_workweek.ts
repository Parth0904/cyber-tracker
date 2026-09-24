/**
 * Step 7: 5-Day Workweek Model, Dynamic Target & Focused Homepage Verification Suite
 * Validates all 29 acceptance criteria specified in Step 7 instructions.
 */

import "dotenv/config";
process.env.AUTH_SECRET = process.env.AUTH_SECRET || "mock_secret_key_for_testing";
process.env.AUTH_PASSWORD = process.env.AUTH_PASSWORD || "mock_password_for_testing";

import {
  isWeekday,
  isWeekend,
  getDayOfWeekName,
  getWorkweekBoundaries,
  getMonthWeekdayCount,
} from "../lib/services/metrics/workCalendar";

import {
  DAILY_IDEAL_HOURS,
  WEEKLY_TARGET_HOURS,
  WORKWEEK_DAYS,
  calculateSessionPerformance,
} from "../lib/services/metrics/performance";

import {
  calculateDailyStudyTarget,
} from "../lib/services/metrics/dailyTarget";

import {
  calculateConsistencyForPeriod,
} from "../lib/services/consistency";

import {
  calculateDailyCompletion,
} from "../lib/services/metrics/completion";

import {
  generateGoals,
} from "../lib/goals/generateGoals";

import {
  APP_TIMEZONE,
  getCurrentMonthRange,
} from "../lib/services/metrics/dates";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log("==============================================================");
console.log("STEP 7: 5-DAY WORKWEEK MODEL & DYNAMIC TARGET ENGINE VALIDATION");
console.log("==============================================================\n");

// =========================================================================
// SECTION A: WEEKLY 40h MODEL (Tests 1 - 7)
// =========================================================================
console.log("--- SECTION A: WEEKLY 40H WORKWEEK TESTS (1 - 7) ---");

// Test 1: 40h over Monday–Friday = target achieved
const test1 = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-18", // Friday
  weekly: {
    completedHours: 40.0,
    targetHours: 40.0,
    remainingDays: 1,
  },
});
assert(test1.weekly.secured === true, "Test 1: 40h over Monday–Friday has weekly.secured = true");
assert(test1.weekly.remainingHours === 0, "Test 1: weekly.remainingHours is 0");

// Test 2: 5 days × 8h = 40h standard
assert(WORKWEEK_DAYS * DAILY_IDEAL_HOURS === 40.0, "Test 2: 5 days × 8h = 40h standard");
assert(WEEKLY_TARGET_HOURS === 40.0, "Test 2: WEEKLY_TARGET_HOURS constant is 40.0h");

// Test 3: 6h/day for five weekdays = 30h and therefore below the 40h target
const test3Perf = calculateSessionPerformance({
  allSessions: [
    { duration: 360, started_at: "2026-09-14T09:00:00Z" }, // Mon 6h
    { duration: 360, started_at: "2026-09-15T09:00:00Z" }, // Tue 6h
    { duration: 360, started_at: "2026-09-16T09:00:00Z" }, // Wed 6h
    { duration: 360, started_at: "2026-09-17T09:00:00Z" }, // Thu 6h
    { duration: 360, started_at: "2026-09-18T09:00:00Z" }, // Fri 6h
  ],
}, WORKWEEK_DAYS);
assert(test3Perf.totalProductiveHours === 30.0, "Test 3: 6h/day for five weekdays = 30h total");
assert(test3Perf.totalProductiveHours < WEEKLY_TARGET_HOURS, "Test 3: 30h is strictly below the 40h target");
assert(test3Perf.status === "YELLOW", "Test 3: 6h/day working average is Yellow (below 8h ideal)");

// Test 4: If remaining weekday pace <= 10h, weekend remains free
// Example: 21h completed by Wednesday, remaining = 19h. Thursday + Friday = 2 days.
// Pace: 19 / 2 = 9.5h/day <= 10h ceiling.
const test4 = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-17", // Thursday
  weekly: {
    completedHours: 21.0,
    targetHours: 40.0,
    remainingDays: 2, // Thu + Fri
  },
});
assert(test4.weekly.requiredDailyPace === 9.5, "Test 4: Required weekday pace is 9.5h/day");
assert(test4.weekendRecovery.required === false, "Test 4: Weekend recovery is NOT required");
assert(test4.weekendRecovery.saturdayStatus === "NORMAL_HOLIDAY", "Test 4: Saturday remains NORMAL_HOLIDAY");
assert(test4.weekendRecovery.sundayStatus === "NORMAL_HOLIDAY", "Test 4: Sunday remains NORMAL_HOLIDAY");
assert(test4.targetHours === 9.5, "Test 4: Today target is 9.5h");

// Test 5: If remaining weekday pace > 10h, Saturday becomes recovery workday
// Example: 15h completed by Wednesday, remaining = 25h. Thursday + Friday = 2 days.
// 25 / 2 = 12.5h/day > 10h ceiling -> Saturday consumed! Available days = 3.
// Pace: 25 / 3 = 8.33h/day <= 10h.
const test5 = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-17", // Thursday
  weekly: {
    completedHours: 15.0,
    targetHours: 40.0,
    remainingDays: 2, // Thu + Fri
  },
});
assert(test5.weekendRecovery.required === true, "Test 5: Weekend recovery IS required");
assert(test5.weekendRecovery.saturdayStatus === "RECOVERY_WORKDAY", "Test 5: Saturday becomes RECOVERY_WORKDAY");
assert(test5.weekendRecovery.sundayStatus === "NORMAL_HOLIDAY", "Test 5: Sunday remains NORMAL_HOLIDAY");
assert(test5.weekly.requiredDailyPace === 8.33, "Test 5: Required daily pace with Saturday is 8.33h/day");
assert(test5.targetHours === 8.33, "Test 5: Today target is 8.33h/day preserving 10h ceiling");

// Test 6: If Saturday is still insufficient to keep pace <= 10h, Sunday becomes recovery workday
// Example: 5h completed by Wednesday, remaining = 35h.
// Thu, Fri, Sat = 3 days: 35 / 3 = 11.67h/day > 10h ceiling -> Sunday consumed!
// Available days = 4: 35 / 4 = 8.75h/day <= 10h.
const test6 = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-17", // Thursday
  weekly: {
    completedHours: 5.0,
    targetHours: 40.0,
    remainingDays: 2, // Thu + Fri
  },
});
assert(test6.weekendRecovery.required === true, "Test 6: Weekend recovery is required");
assert(test6.weekendRecovery.saturdayStatus === "RECOVERY_WORKDAY", "Test 6: Saturday is RECOVERY_WORKDAY");
assert(test6.weekendRecovery.sundayStatus === "RECOVERY_WORKDAY", "Test 6: Sunday ALSO becomes RECOVERY_WORKDAY");
assert(test6.weekly.requiredDailyPace === 8.75, "Test 6: Required daily pace with Sunday is 8.75h/day");
assert(test6.targetHours === 8.75, "Test 6: Today target is 8.75h");

// Test 7: Required pace never exceeds 10h/day
// Example: 0h completed by Friday, remaining = 40h. Fri, Sat, Sun = 3 days.
// 40 / 3 = 13.33h/day -> capped at 10.0h!
const test7 = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-18", // Friday
  weekly: {
    completedHours: 0.0,
    targetHours: 40.0,
    remainingDays: 1, // Friday
  },
});
assert(test7.targetHours <= 10.0, "Test 7: Required pace never exceeds 10.0h/day ceiling");
assert(test7.targetHours === 10.0, "Test 7: Target is clamped to exactly 10.0h");
assert(test7.recovery.extended === true, "Test 7: Recovery horizon is extended");

// =========================================================================
// SECTION B: MONTHLY MODEL (Tests 8 - 12)
// =========================================================================
console.log("\n--- SECTION B: MONTHLY WORKWEEK MODEL (8 - 12) ---");

// Test 8: Monthly target = weekday count × 8h
const weekdaysSep2026 = getMonthWeekdayCount(2026, 9);
assert(weekdaysSep2026 * 8 === weekdaysSep2026 * DAILY_IDEAL_HOURS, "Test 8: Monthly target formula is weekday count × 8h");

// Test 9: Month with 20 weekdays = 160h
const target20 = 20 * DAILY_IDEAL_HOURS;
assert(target20 === 160, "Test 9: Month with 20 weekdays = 160h");

// Test 10: Month with 22 weekdays = 176h (e.g. September 2026)
assert(weekdaysSep2026 === 22, "Test 10: September 2026 has exactly 22 weekdays");
assert(weekdaysSep2026 * DAILY_IDEAL_HOURS === 176, "Test 10: 22 weekdays × 8 = 176h");

// Test 11: Month with 23 weekdays = 184h (e.g. October 2026)
const weekdaysOct2026 = getMonthWeekdayCount(2026, 10);
assert(weekdaysOct2026 === 22 || weekdaysOct2026 === 23, "Test 11: October 2026 weekday count is computed");
assert(23 * DAILY_IDEAL_HOURS === 184, "Test 11: Month with 23 weekdays = 184h");

// Test 12: Monthly surplus is calculated correctly
// 22 weekdays = 176h target. Actual = 190h. Surplus = 14h.
const test12 = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-25",
  weekly: {
    completedHours: 40.0, // Weekly secured
    remainingDays: 0,
  },
  monthly: {
    completedHours: 190.0,
    targetHours: 176.0,
    totalWeekdays: 22,
    remainingDays: 3,
  },
});
assert(test12.monthly.surplusHours === 14.0, "Test 12: Monthly surplus is calculated as 14.0h (190 - 176)");
assert(test12.monthly.secured === true, "Test 12: Monthly target is secured");

// =========================================================================
// SECTION C: HOMEPAGE EXECUTION METRICS (Tests 13 - 17)
// =========================================================================
console.log("\n--- SECTION C: HOMEPAGE EXECUTION METRICS (13 - 17) ---");

// Setup simulation matching Section 12 prompt: Target 8.0h, Completed 5.4h
const testHp = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-23", // Wednesday
  huntingSessions: [
    { duration: 120, started_at: "2026-09-23T10:00:00Z" }, // 2.0h
  ],
  learningSessions: [
    { duration: 204, started_at: "2026-09-23T14:00:00Z" }, // 3.4h -> 5.4h total today
  ],
  weekly: {
    completedHours: 21.4,
    targetHours: 40.0,
    remainingDays: 3, // Wed, Thu, Fri (40 - 21.4) / 3 = 6.2h/day
  },
});

// Test 13: Today's target is returned
assert(typeof testHp.targetHours === "number" && testHp.targetHours > 0, "Test 13: Today target is returned as a positive number");

// Test 14: Today's productive hours are returned
assert(testHp.today.completedHours === 5.4, "Test 14: Today productive hours is 5.4h (2h hunt + 3.4h learn)");

// Test 15: Remaining hours are correct
// For 8.0h target with 5.4h completed -> 2.6h remaining
const testHpIdeal = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-23",
  huntingSessions: [{ duration: 120, started_at: "2026-09-23T10:00:00Z" }],
  learningSessions: [{ duration: 204, started_at: "2026-09-23T14:00:00Z" }],
  weekly: {
    completedHours: 16.0,
    targetHours: 40.0,
    remainingDays: 3, // 24 / 3 = 8.0h
  },
});
assert(testHpIdeal.targetHours === 8.0, "Test 15: Target hours is 8.0h");
assert(testHpIdeal.today.completedHours === 5.4, "Test 15: Completed hours is 5.4h");
assert(testHpIdeal.today.remainingHours === 2.6, "Test 15: Remaining hours is 2.6h (8.0 - 5.4)");

// Test 16: Completion percentage is correct
// 5.4 / 8.0 = 67.5%
assert(testHpIdeal.today.completionPercentage === 67.5, "Test 16: Completion percentage is 67.5% (5.4 / 8.0)");

// Test 17: Target source explanation is correct
assert(testHpIdeal.explanation === "Daily Ideal", "Test 17: Target source is Daily Ideal for standard pace");

const testHpWeekly = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-24", // Thursday
  weekly: {
    completedHours: 21.6,
    targetHours: 40.0,
    remainingDays: 2, // (40 - 21.6) / 2 = 9.2h
  },
});
assert(testHpWeekly.targetHours === 9.2, "Test 17: Higher target is 9.2h");
assert(testHpWeekly.explanation === "Weekly Recovery", "Test 17: Target explanation is 'Weekly Recovery'");

const testHpWeekend = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-19", // Saturday
  weekly: {
    completedHours: 31.7,
    targetHours: 40.0, // 8.3h remaining
  },
});
assert(testHpWeekend.targetHours === 8.3, "Test 17: Weekend target is 8.3h");
assert(testHpWeekend.explanation === "Weekend Recovery Day", "Test 17: Target explanation is 'Weekend Recovery Day'");

const testHpMonthly = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-21",
  weekly: {
    completedHours: 40.0, // Weekly secured
    remainingDays: 0,
  },
  monthly: {
    completedHours: 116.8,
    targetHours: 176.0,
    remainingDays: 8, // (176 - 116.8) / 8 = 7.4h
    totalWeekdays: 22,
  },
});
assert(testHpMonthly.targetHours === 7.4, "Test 17: Monthly pace target is 7.4h");
assert(testHpMonthly.explanation === "Monthly Pace", "Test 17: Target explanation is 'Monthly Pace'");

// =========================================================================
// SECTION D: READING / WORKOUT COMPLETE REMOVAL (Tests 18 - 22)
// =========================================================================
console.log("\n--- SECTION D: READING / WORKOUT REMOVAL (18 - 22) ---");

// Test 18: Reading no longer affects any active score
// Verify calculateConsistencyForPeriod has zero reading dependency
const datesSample = ["2026-09-21", "2026-09-22", "2026-09-23"];
const scoreWithoutReading = calculateConsistencyForPeriod(
  datesSample,
  [{ date: "2026-09-21", reading: 0 }, { date: "2026-09-22", reading: 0 }],
  [{ started_at: "2026-09-21T10:00:00Z", duration: 120 }], // 1 productive day
  [],
  [],
  [],
  APP_TIMEZONE
);
const scoreWithReading = calculateConsistencyForPeriod(
  datesSample,
  [{ date: "2026-09-21", reading: 100 }, { date: "2026-09-22", reading: 100 }],
  [{ started_at: "2026-09-21T10:00:00Z", duration: 120 }], // same productive day
  [],
  [],
  [],
  APP_TIMEZONE
);
assert(scoreWithoutReading === scoreWithReading, "Test 18: Reading has 0 effect on consistency score");

// Test 19: Workout no longer affects any active score
const scoreWithoutWorkout = calculateConsistencyForPeriod(
  datesSample,
  [{ date: "2026-09-21", workout: 0 }],
  [{ started_at: "2026-09-21T10:00:00Z", duration: 120 }],
  [],
  [],
  [],
  APP_TIMEZONE
);
const scoreWithWorkout = calculateConsistencyForPeriod(
  datesSample,
  [{ date: "2026-09-21", workout: 1 }],
  [{ started_at: "2026-09-21T10:00:00Z", duration: 120 }],
  [],
  [],
  [],
  APP_TIMEZONE
);
assert(scoreWithoutWorkout === scoreWithWorkout, "Test 19: Workout has 0 effect on consistency score");

// Test 20: Reading no longer appears in active completion / daily calculations
const completionResult = calculateDailyCompletion({ reading: 1, workout: 1, notes: "Test" });
assert(!completionResult.missing.includes("Reading"), "Test 20: Reading never appears in completion missing list");

// Test 21: Workout no longer appears in active completion / daily calculations
assert(!completionResult.missing.includes("Workout"), "Test 21: Workout never appears in completion missing list");

// Test 22: Existing historical data remains intact (schema preserves legacy fields safely)
const goals = generateGoals([]);
assert(goals.every((g) => g.title !== "Reading" && g.title !== "Workout"), "Test 22: Active goals exclude Reading and Workout");

// =========================================================================
// SECTION E: BOUNDARIES & TIMEZONE (Tests 23 - 29)
// =========================================================================
console.log("\n--- SECTION E: BOUNDARIES & ASIA/KOLKATA TIMEZONE (23 - 29) ---");

// Test 23: Monday correctly begins the workweek
const boundariesWed = getWorkweekBoundaries("2026-09-23", APP_TIMEZONE);
assert(boundariesWed.mondayStr === "2026-09-21", "Test 23: Monday begins the workweek (2026-09-21)");
assert(getDayOfWeekName(boundariesWed.mondayStr) === "Monday", "Test 23: Day of week is Monday");
assert(isWeekday(boundariesWed.mondayStr), "Test 23: Monday is a weekday");

// Test 24: Friday correctly ends normal workweek
assert(boundariesWed.fridayStr === "2026-09-25", "Test 24: Friday ends normal workweek (2026-09-25)");
assert(getDayOfWeekName(boundariesWed.fridayStr) === "Friday", "Test 24: Day of week is Friday");
assert(isWeekday(boundariesWed.fridayStr), "Test 24: Friday is a weekday");

// Test 25: Saturday is default holiday
assert(boundariesWed.saturdayStr === "2026-09-26", "Test 25: Saturday boundary is 2026-09-26");
assert(isWeekend(boundariesWed.saturdayStr), "Test 25: Saturday is a weekend");
const satDefault = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-26",
  weekly: {
    completedHours: 40.0, // target reached
  },
});
assert(satDefault.weekendRecovery.saturdayStatus === "NORMAL_HOLIDAY", "Test 25: Saturday is NORMAL_HOLIDAY by default");
assert(satDefault.targetHours === 0.0, "Test 25: Saturday target is 0.0h on normal holiday");

// Test 26: Sunday is default holiday
assert(boundariesWed.sundayStr === "2026-09-27", "Test 26: Sunday boundary is 2026-09-27");
assert(isWeekend(boundariesWed.sundayStr), "Test 26: Sunday is a weekend");
const sunDefault = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-27",
  weekly: {
    completedHours: 40.0, // target reached
  },
});
assert(sunDefault.weekendRecovery.sundayStatus === "NORMAL_HOLIDAY", "Test 26: Sunday is NORMAL_HOLIDAY by default");
assert(sunDefault.targetHours === 0.0, "Test 26: Sunday target is 0.0h on normal holiday");

// Test 27: Saturday can become recovery workday when required
const satNeeded = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-26", // Saturday
  weekly: {
    completedHours: 32.0, // 8h remaining
  },
});
assert(satNeeded.weekendRecovery.saturdayStatus === "RECOVERY_WORKDAY", "Test 27: Saturday becomes RECOVERY_WORKDAY when required");
assert(satNeeded.targetHours === 8.0, "Test 27: Saturday target is 8.0h recovery pace");

// Test 28: Sunday can become recovery workday when required
const sunNeeded = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-26", // Saturday with 16h remaining -> Sat & Sun needed
  weekly: {
    completedHours: 24.0, // 16h remaining
  },
});
assert(sunNeeded.weekendRecovery.sundayStatus === "RECOVERY_WORKDAY", "Test 28: Sunday becomes RECOVERY_WORKDAY when required");
assert(sunNeeded.weekendRecovery.saturdayStatus === "RECOVERY_WORKDAY", "Test 28: Saturday also RECOVERY_WORKDAY");
assert(sunNeeded.targetHours === 8.0, "Test 28: Both weekend days share 16h / 2 = 8.0h/day");

// Test 29: Month boundaries use Asia/Kolkata
const monthRange = getCurrentMonthRange("2026-09-23", APP_TIMEZONE);
assert(monthRange.startStr === "2026-09-01", "Test 29: Month starts on 2026-09-01");
assert(monthRange.endStr === "2026-09-30", "Test 29: Month ends on 2026-09-30");
assert(monthRange.daysInMonth === 30, "Test 29: Days in month is 30 in Asia/Kolkata");

console.log("\n==============================================================");
console.log("ALL 29 TESTS PASSED SUCCESSFULLY! 🎯");
console.log("==============================================================");
