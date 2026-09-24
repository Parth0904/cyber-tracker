/**
 * Dedicated Regression Test Suite: Daily Target Stability & Beginning-of-Day Anchoring
 * 
 * Verifies that:
 * 1. Fresh Monday -> 8.0h.
 * 2. Monday after 2h worked -> target remains 8.0h, remaining decreases to 6.0h.
 * 3. Normal Tuesday with Monday = 8h -> target remains 8.0h throughout Tuesday (0h, 3h, 8h).
 * 4. Friday with Mon-Thu = 32h -> target remains 8.0h after 0h, 4h, and 8h worked (no premature 100% completion or monthly jump).
 * 5. Current Thursday scenario (Mon-Wed ~0h) -> target remains 10.0h after today's 0h, 1.56h, 4h, and 8h progress.
 * 6. Remaining hours decrease correctly as today's work increases.
 * 7. Saturday recovery activation remains correct.
 * 8. Sunday recovery activation remains correct.
 * 9. 10h/day ceiling remains enforced with extended horizon flag.
 * 10. Weekly and monthly deficits are not double-counted.
 */

import { calculateDailyStudyTarget } from "../lib/services/metrics/dailyTarget";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log("==============================================================");
console.log("DAILY TARGET STABILITY & RECOVERY REGRESSION TEST SUITE");
console.log("==============================================================\n");

// -------------------------------------------------------------------------
// 1. Fresh Monday -> 8.0h
// -------------------------------------------------------------------------
console.log("--- 1. Fresh Monday (0h start) ---");
const monStart = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-21",
  weekly: { completedHours: 0.0, targetHours: 40.0, remainingDays: 5 },
  today: { completedHours: 0.0 },
});
assert(monStart.targetHours === 8.0, "1a. Fresh Monday target is 8.0h");
assert(monStart.today.remainingHours === 8.0, "1b. Fresh Monday remaining is 8.0h");
assert(monStart.today.completionPercentage === 0, "1c. Fresh Monday completion is 0%");

// -------------------------------------------------------------------------
// 2. Monday after 2h worked -> target remains 8.0h
// -------------------------------------------------------------------------
console.log("\n--- 2. Monday after 2h worked ---");
const mon2h = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-21",
  weekly: { completedHours: 2.0, targetHours: 40.0, remainingDays: 5 },
  today: { completedHours: 2.0 },
});
assert(mon2h.targetHours === 8.0, "2a. Monday target remains stable at 8.0h after 2h worked");
assert(mon2h.today.remainingHours === 6.0, "2b. Monday remaining hours decreases to 6.0h (8.0 - 2.0)");
assert(mon2h.today.completionPercentage === 25.0, "2c. Monday completion is 25.0% (2.0 / 8.0)");

// -------------------------------------------------------------------------
// 3. Normal Tuesday with Monday = 8h -> target remains 8.0h throughout Tuesday
// -------------------------------------------------------------------------
console.log("\n--- 3. Normal Tuesday throughout the day (Mon = 8.0h) ---");
for (const h of [0.0, 3.0, 5.5, 8.0]) {
  const tue = calculateDailyStudyTarget({
    asOfDateStr: "2026-09-22",
    weekly: { completedHours: 8.0 + h, targetHours: 40.0, remainingDays: 4 },
    today: { completedHours: h },
  });
  assert(tue.targetHours === 8.0, `3. Tuesday target remains 8.0h at ${h}h worked`);
  const expectedRemaining = Math.max(0, Math.round((8.0 - h) * 100) / 100);
  assert(tue.today.remainingHours === expectedRemaining, `3. Tuesday remaining is ${expectedRemaining}h at ${h}h worked`);
}

// -------------------------------------------------------------------------
// 4. Friday with Mon-Thu = 32h -> target remains 8.0h after 0h, 4h, and 8h worked
// -------------------------------------------------------------------------
console.log("\n--- 4. Friday (Mon-Thu = 32h, 8h remaining) ---");
for (const h of [0.0, 4.0, 8.0]) {
  const fri = calculateDailyStudyTarget({
    asOfDateStr: "2026-09-25",
    weekly: { completedHours: 32.0 + h, targetHours: 40.0, remainingDays: 1 },
    today: { completedHours: h },
    monthly: { completedHours: 100.0, targetHours: 176.0, remainingDays: 5 }, // Month has deficit
  });
  assert(fri.targetHours === 8.0, `4. Friday target remains 8.0h at ${h}h worked (no decay, no monthly jump)`);
  assert(fri.targetSource === "WEEKLY", `4. Friday targetSource remains WEEKLY at ${h}h worked`);
  const expectedRemaining = Math.max(0, Math.round((8.0 - h) * 100) / 100);
  assert(fri.today.remainingHours === expectedRemaining, `4. Friday remaining is ${expectedRemaining}h at ${h}h worked`);
}

// -------------------------------------------------------------------------
// 5. Current Thursday scenario -> target remains 10.0h after 0h, 1.56h, 4h, 8h, 10h
// -------------------------------------------------------------------------
console.log("\n--- 5. Current Thursday Scenario (Mon-Wed = 0.02h) ---");
for (const h of [0.0, 1.56, 4.0, 8.0, 10.0]) {
  const thu = calculateDailyStudyTarget({
    asOfDateStr: "2026-09-24",
    weekly: { completedHours: 0.02 + h, targetHours: 40.0, remainingDays: 2 },
    today: { completedHours: h },
  });
  assert(thu.targetHours === 10.0, `5. Thursday target remains stable at 10.0h at ${h}h worked`);
  assert(thu.weekendRecovery.saturdayStatus === "RECOVERY_WORKDAY", `5. Saturday is RECOVERY_WORKDAY at ${h}h worked`);
  assert(thu.weekendRecovery.sundayStatus === "RECOVERY_WORKDAY", `5. Sunday is RECOVERY_WORKDAY at ${h}h worked`);
  const expectedRemaining = Math.max(0, Math.round((10.0 - h) * 100) / 100);
  assert(thu.today.remainingHours === expectedRemaining, `5. Thursday remaining is ${expectedRemaining}h at ${h}h worked`);
}

// Specifically verify Thursday live values matching user observation
const thuLive = calculateDailyStudyTarget({
  workSecondsByDate: { "2026-09-23": 87, "2026-09-24": 5627 },
  asOfDateStr: "2026-09-24",
});
assert(thuLive.targetHours === 10.0, "5-Live. Thursday targetHours is 10.0h");
assert(thuLive.today.completedHours === 1.56, "5-Live. Thursday completedHours is 1.56h");
assert(thuLive.today.remainingHours === 8.44, "5-Live. Thursday remainingHours is 8.44h (10.00 - 1.56)");
assert(thuLive.today.completionPercentage === 15.6, "5-Live. Thursday completion is 15.6%");

// -------------------------------------------------------------------------
// 6. Remaining hours decrease correctly as today's work increases
// -------------------------------------------------------------------------
console.log("\n--- 6. Remaining hours decrease monotonically ---");
let prevRemaining = 10.0;
for (let h = 1; h <= 10; h++) {
  const step = calculateDailyStudyTarget({
    asOfDateStr: "2026-09-24",
    weekly: { completedHours: 0.02 + h, targetHours: 40.0, remainingDays: 2 },
    today: { completedHours: h },
  });
  assert(step.today.remainingHours < prevRemaining, `6. Remaining hours decreased at ${h}h worked (${step.today.remainingHours} < ${prevRemaining})`);
  assert(step.targetHours === 10.0, `6. Target remained constant at 10.0h`);
  prevRemaining = step.today.remainingHours;
}

// -------------------------------------------------------------------------
// 7. Saturday recovery activation when weekday pace > 10h
// -------------------------------------------------------------------------
console.log("\n--- 7. Saturday Recovery Activation ---");
// 15h completed Mon-Wed. Thu+Fri = 2 days. 25h / 2 = 12.5h > 10h -> Saturday activated: 25 / 3 = 8.33h <= 10h
const satAct = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-24",
  weekly: { completedHours: 15.0, targetHours: 40.0, remainingDays: 2 },
  today: { completedHours: 0.0 },
});
assert(satAct.targetHours === 8.33, "7a. Saturday activation target is 8.33h");
assert(satAct.weekendRecovery.saturdayStatus === "RECOVERY_WORKDAY", "7b. Saturday is RECOVERY_WORKDAY");
assert(satAct.weekendRecovery.sundayStatus === "NORMAL_HOLIDAY", "7c. Sunday remains NORMAL_HOLIDAY");

// -------------------------------------------------------------------------
// 8. Sunday recovery activation when Saturday still cannot keep pace <= 10h
// -------------------------------------------------------------------------
console.log("\n--- 8. Sunday Recovery Activation ---");
// 5h completed Mon-Wed. 35h / 3 (with Sat) = 11.67h > 10h -> Sunday activated: 35 / 4 = 8.75h <= 10h
const sunAct = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-24",
  weekly: { completedHours: 5.0, targetHours: 40.0, remainingDays: 2 },
  today: { completedHours: 0.0 },
});
assert(sunAct.targetHours === 8.75, "8a. Sunday activation target is 8.75h");
assert(sunAct.weekendRecovery.saturdayStatus === "RECOVERY_WORKDAY", "8b. Saturday is RECOVERY_WORKDAY");
assert(sunAct.weekendRecovery.sundayStatus === "RECOVERY_WORKDAY", "8c. Sunday is RECOVERY_WORKDAY");

// -------------------------------------------------------------------------
// 9. 10h/day ceiling remains enforced
// -------------------------------------------------------------------------
console.log("\n--- 9. 10h/day Ceiling Enforcement ---");
// Friday with 0h done. 40h / 3 = 13.33h -> Clamped to 10.0h, recovery extended
const ceilCheck = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-25",
  weekly: { completedHours: 0.0, targetHours: 40.0, remainingDays: 1 },
  today: { completedHours: 0.0 },
});
assert(ceilCheck.targetHours === 10.0, "9a. Target is clamped to 10.0h ceiling");
assert(ceilCheck.recovery.extended === true, "9b. Extended recovery horizon is flagged");

// -------------------------------------------------------------------------
// 10. Weekly and monthly deficits are not double-counted
// -------------------------------------------------------------------------
console.log("\n--- 10. Deficits Not Double-Counted ---");
const noDouble = calculateDailyStudyTarget({
  asOfDateStr: "2026-09-22", // Tuesday
  weekly: { completedHours: 6.0, targetHours: 40.0, remainingDays: 4 }, // 2h weekly deficit -> 34 / 4 = 8.5h
  monthly: { completedHours: 20.0, targetHours: 176.0, remainingDays: 15 }, // Large monthly deficit
  today: { completedHours: 0.0 },
});
assert(noDouble.targetHours === 8.5, "10a. Target is 8.5h (governed purely by weekly pace)");
assert(noDouble.targetSource === "WEEKLY", "10b. Target source is WEEKLY (monthly deficit did not inflate target)");

console.log("\n==============================================================");
console.log("ALL 10 REGRESSION SUITE CATEGORIES PASSED PERFECTLY! 🎯");
console.log("==============================================================");
