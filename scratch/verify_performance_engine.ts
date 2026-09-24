/**
 * Step 4 Performance Engine Verification Script
 * Validates canonical standards, equivalence, calendar denominators, capacity planning,
 * buffer days, unclamped averages, recovery ceiling, and extended horizon.
 */

import {
  DAILY_IDEAL_HOURS,
  DAILY_ACCEPTABLE_HOURS,
  PERIOD_IDEAL_DAILY_HOURS,
  PERIOD_ACCEPTABLE_DAILY_HOURS,
  REALISTIC_MAX_DAILY_SESSION_HOURS,
  classifyDailyPerformance,
  classifyPeriodPerformance,
  calculateSessionPerformance,
  calculateSessionCapacityPlan,
} from "../lib/services/metrics/performance";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log("=== STEP 4: PERFORMANCE ENGINE VALIDATION ===");

// 1. Check Constants
assert(DAILY_IDEAL_HOURS === 8.0, "DAILY_IDEAL_HOURS is 8.0");
assert(DAILY_ACCEPTABLE_HOURS === 6.0, "DAILY_ACCEPTABLE_HOURS is 6.0");
assert(PERIOD_IDEAL_DAILY_HOURS === 8.0, "PERIOD_IDEAL_DAILY_HOURS is 8.0");
assert(PERIOD_ACCEPTABLE_DAILY_HOURS === 6.0, "PERIOD_ACCEPTABLE_DAILY_HOURS is 6.0");
assert(REALISTIC_MAX_DAILY_SESSION_HOURS === 10.0, "REALISTIC_MAX_DAILY_SESSION_HOURS is 10.0");

// 2. Daily Classification Standards
assert(classifyDailyPerformance(8.0) === "GREEN", "Daily 8.0h is GREEN (Ideal)");
assert(classifyDailyPerformance(10.5) === "GREEN", "Daily 10.5h is GREEN (Above Ideal)");
assert(classifyDailyPerformance(6.0) === "YELLOW", "Daily 6.0h is YELLOW (Acceptable threshold)");
assert(classifyDailyPerformance(7.9) === "YELLOW", "Daily 7.9h is YELLOW (Acceptable tier)");
assert(classifyDailyPerformance(5.9) === "RED", "Daily 5.9h is RED (Below Acceptable)");
assert(classifyDailyPerformance(0) === "RED", "Daily 0h is RED (Below Acceptable)");

// 3. Period Classification Standards (Weekly / Monthly / Rolling)
assert(classifyPeriodPerformance(6.0) === "GREEN", "Period 6.0h/day is GREEN (Ideal)");
assert(classifyPeriodPerformance(7.5) === "GREEN", "Period 7.5h/day is GREEN (Above Ideal)");
assert(classifyPeriodPerformance(5.0) === "YELLOW", "Period 5.0h/day is YELLOW (Acceptable threshold)");
assert(classifyPeriodPerformance(5.9) === "YELLOW", "Period 5.9h/day is YELLOW (Acceptable tier)");
assert(classifyPeriodPerformance(4.9) === "RED", "Period 4.9h/day is RED (Below Acceptable)");

// 4. Equivalence of Productive Session Hours
// 4h learning + 2h hunting = 6h productive
const mix1 = calculateSessionPerformance({
  learningSessions: [{ duration: 240, started_at: "2026-09-17T09:00:00Z" }],
  huntingSessions: [{ duration: 120, started_at: "2026-09-17T14:00:00Z" }],
}, 1);
assert(mix1.totalProductiveHours === 6.0, "4h learning + 2h hunting = 6h productive");
assert(mix1.status === "YELLOW", "6h single day is YELLOW (Acceptable)");

// 6h learning + 0h hunting = 6h productive
const mix2 = calculateSessionPerformance({
  learningSessions: [{ duration: 360, started_at: "2026-09-17T09:00:00Z" }],
  huntingSessions: [],
}, 1);
assert(mix2.totalProductiveHours === 6.0, "6h learning + 0h hunting = 6h productive");
assert(mix2.status === "YELLOW", "6h single day is YELLOW (Acceptable)");

// 2h learning + 4h hunting = 6h productive
const mix3 = calculateSessionPerformance({
  learningSessions: [{ duration: 120, started_at: "2026-09-17T09:00:00Z" }],
  huntingSessions: [{ duration: 240, started_at: "2026-09-17T14:00:00Z" }],
}, 1);
assert(mix3.totalProductiveHours === 6.0, "2h learning + 4h hunting = 6h productive");
assert(mix3.status === "YELLOW", "6h single day is YELLOW (Acceptable)");

// 5. Calendar Day Denominators (No weekend/holiday exclusion)
// 42h over 7 calendar days = exactly 6.0h/day
const weeklyPerf = calculateSessionPerformance({
  allSessions: [
    { duration: 600, started_at: "2026-09-14T10:00:00Z" }, // Mon 10h
    { duration: 480, started_at: "2026-09-15T10:00:00Z" }, // Tue 8h
    { duration: 480, started_at: "2026-09-16T10:00:00Z" }, // Wed 8h
    { duration: 480, started_at: "2026-09-17T10:00:00Z" }, // Thu 8h
    { duration: 480, started_at: "2026-09-18T10:00:00Z" }, // Fri 8h
    // Sat 0h
    // Sun 0h
  ],
}, 7);
assert(weeklyPerf.totalProductiveHours === 42.0, "Total productive hours is 42.0h");
assert(weeklyPerf.actualDailyAverage === 6.0, "Weekly average divides by 7 = 6.0h/day (Sunday 0h counts normally)");
assert(weeklyPerf.status === "GREEN", "Weekly 6.0h/day average is GREEN");

// Monthly 180h over 30 days = 6.0h/day
const monthlyPerf = calculateSessionPerformance({
  allSessions: [{ duration: 180 * 60, started_at: "2026-09-01T10:00:00Z" }],
}, 30);
assert(monthlyPerf.actualDailyAverage === 6.0, "Monthly average divides by 30 calendar days = 6.0h/day");
assert(monthlyPerf.status === "GREEN", "Monthly 6.0h/day is GREEN");

// 6. Unrestricted Actual Averages (NEVER clamped)
const intenseDay = calculateSessionPerformance({
  allSessions: [{ duration: 12 * 60, started_at: "2026-09-17T08:00:00Z" }],
}, 1);
assert(intenseDay.totalProductiveHours === 12.0, "12h recorded day remains 12.0h (unclamped)");
assert(intenseDay.actualDailyAverage === 12.0, "Daily average remains 12.0h (unclamped)");

const intenseWeek = calculateSessionPerformance({
  allSessions: [{ duration: 77 * 60, started_at: "2026-09-14T08:00:00Z" }],
}, 7);
assert(intenseWeek.actualDailyAverage === 11.0, "Weekly average remains 11.0h/day (unclamped to 10h ceiling)");

// 7. Capacity Planning: Required Pace towards 6.0h Green Threshold
// Mon-Sun week (7 days). As of Thu (day 4). 24h completed. 3 days left.
const capacityPlan1 = calculateSessionCapacityPlan({
  startDateStr: "2026-09-14",
  endDateStr: "2026-09-20",
  asOfDateStr: "2026-09-17",
  completedHuntingHours: 12.0,
  completedLearningHours: 12.0,
});
assert(capacityPlan1.totalCalendarDays === 7, "Week total calendar days = 7");
assert(capacityPlan1.elapsedCalendarDays === 4, "Elapsed calendar days = 4");
assert(capacityPlan1.remainingCalendarDays === 3, "Remaining calendar days = 3");
assert(capacityPlan1.completedProductiveHours === 24.0, "Completed productive hours = 24.0h");
assert(capacityPlan1.totalTargetHours === 42.0, "Target for week = 42.0h (7 * 6.0h Green target)");
assert(capacityPlan1.remainingTargetHours === 18.0, "Remaining target = 18.0h");
assert(capacityPlan1.requiredDailyPace === 6.0, "Required daily pace = 18 / 3 = 6.0h/day");
assert(capacityPlan1.recoveryFeasibility === "ON_TRACK", "Feasibility is ON_TRACK");

// 8. Buffer Days Capacity
// Mon-Sun week (7 days). As of Thu (day 4). 36h completed. 3 days left.
// Green target so far = 4 * 6 = 24h. Surplus = 36 - 24 = 12h.
// 12 / 6 = 2 buffer days.
const capacityPlan2 = calculateSessionCapacityPlan({
  startDateStr: "2026-09-14",
  endDateStr: "2026-09-20",
  asOfDateStr: "2026-09-17",
  completedHuntingHours: 18.0,
  completedLearningHours: 18.0,
});
assert(capacityPlan2.surplusHours === 12.0, "Surplus hours = 12.0h");
assert(capacityPlan2.bufferDaysCapacity === 2, "Buffer days = 2 zero-hour days can be absorbed");
assert(capacityPlan2.requiredDailyPace === 2.0, "Required daily pace = (42 - 36) / 3 = 2.0h/day");
assert(capacityPlan2.recoveryFeasibility === "ON_TRACK", "Feasibility is ON_TRACK");

// 9. Recovery Ceiling (10.0h max) and Extended Horizon
// Mon-Sun week (7 days). As of Fri (day 5). 10h completed. 2 days left.
// Math need: (42 - 10) / 2 = 16.0h/day (unrealistic in remaining 2 days)
const capacityPlan3 = calculateSessionCapacityPlan({
  startDateStr: "2026-09-14",
  endDateStr: "2026-09-20",
  asOfDateStr: "2026-09-18",
  completedHuntingHours: 5.0,
  completedLearningHours: 5.0,
});
assert(capacityPlan3.requiredDailyPace === 16.0, "Math required pace = 16.0h/day");
assert(capacityPlan3.recoveryFeasibility === "NOT_REALISTIC_IN_PERIOD", "Feasibility is NOT_REALISTIC_IN_PERIOD");
assert(capacityPlan3.extendedRecovery !== undefined, "Extended recovery object is present");
// Elapsed target at 6h/day: 5 * 6 = 30h. Completed = 10h. Deficit = 20h.
// Rate = 10 - 6 = 4h/day. Days needed = ceil(20 / 4) = 5 days.
assert(capacityPlan3.extendedRecovery?.deficitHours === 20.0, "Deficit hours = 20.0h");
assert(capacityPlan3.extendedRecovery?.dailyRecoverySurplusRate === 4.0, "Daily recovery surplus rate = 4.0h/day");
assert(capacityPlan3.extendedRecovery?.extendedDaysNeeded === 5, "Extended days needed = 5 days");
assert(capacityPlan3.extendedRecovery?.projectedRecoveryDate === "2026-09-23", "Projected recovery date = 2026-09-23 (2026-09-18 + 5 days)");

// 10. Test compilePerformanceOverview compilation
import { compilePerformanceOverview } from "../lib/services/metrics/performance";
const overview = compilePerformanceOverview({
  huntingSessions: [
    { started_at: "2026-09-17T09:00:00+05:30", duration: 180 }, // 3h hunting today
    { started_at: "2026-09-16T10:00:00+05:30", duration: 240 }, // 4h hunting yesterday
  ],
  learningSessions: [
    { started_at: "2026-09-17T14:00:00+05:30", duration: 300 }, // 5h learning today
    { started_at: "2026-09-15T10:00:00+05:30", duration: 360 }, // 6h learning Tue
  ],
  asOfDateStr: "2026-09-17",
  timezone: "Asia/Kolkata",
});
assert(overview.today.performance.totalHuntingHours === 3.0, "Overview today hunting = 3.0h");
assert(overview.today.performance.totalLearningHours === 5.0, "Overview today learning = 5.0h");
assert(overview.today.performance.totalProductiveHours === 8.0, "Overview today productive = 8.0h");
assert(overview.today.performance.status === "GREEN", "Overview today status = GREEN (Ideal 8h met)");
assert(overview.currentWeek.capacityPlan.totalTargetHours === 42.0, "Current week target = 42.0h");
assert(overview.currentMonth.capacityPlan.totalTargetHours === 180.0, "Current September target = 180.0h (30 days * 6h)");
assert(overview.rolling7Days.performance.totalProductiveHours === 18.0, "Rolling 7-day productive hours = 18.0h");

console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The Performance Engine is 100% compliant.");
