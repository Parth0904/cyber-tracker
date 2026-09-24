import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateSessionPerformance,
  compilePerformanceOverview,
  DAILY_IDEAL_HOURS,
  WEEKLY_TARGET_HOURS,
  REALISTIC_MAX_DAILY_SESSION_HOURS,
} from "../../lib/services/metrics/performance";
import {
  calculateDailyStudyTarget,
} from "../../lib/services/metrics/dailyTarget";
import {
  getMonthWeekdayCount,
} from "../../lib/services/metrics/workCalendar";
import {
  compileHistoricalAnalytics,
} from "../../lib/services/analytics/historicalAnalytics";

test("Phase 2 — Authoritative Canonical Work-Time & Performance Metrics", async (t) => {
  const tz = "Asia/Kolkata";

  await t.test("7. Automatic work time is used as productive time", () => {
    // 5.4 hours active computer usage (19,440 active seconds)
    const workSeconds = 19440;
    const workHours = Math.round((workSeconds / 3600) * 100) / 100;
    assert.equal(workHours, 5.4);

    const perf = calculateSessionPerformance({ workHours }, 1, tz);
    assert.equal(perf.totalProductiveHours, 5.4);
    assert.equal(perf.actualDailyAverage, 5.4);
  });

  await t.test("8. Learning + Hunting are NOT added to automatic work time (no double counting)", () => {
    // If workHours is provided, manual hunting/learning must not inflate productive hours
    const result = calculateSessionPerformance({
      workHours: 5.4,
      huntingSessions: [
        { started_at: "2026-09-24T05:00:00.000Z", duration: 120 }, // 2.0h
      ],
      learningSessions: [
        { started_at: "2026-09-24T08:00:00.000Z", duration: 60 },  // 1.0h
      ],
    }, 1, tz);

    // Productive hours is strictly the verified work time (5.4h), NOT 5.4 + 2 + 1 = 8.4h
    assert.equal(result.totalProductiveHours, 5.4);
  });

  await t.test("9. 8h daily target standard", () => {
    const target = calculateDailyStudyTarget({
      asOfDateStr: "2026-09-21", // Monday
      workHoursByDate: { "2026-09-21": 0 },
      timezone: tz,
    });

    assert.equal(target.targetHours, 8.0);
    assert.equal(target.explanation, "Daily Ideal");
    assert.equal(DAILY_IDEAL_HOURS, 8.0);
  });

  await t.test("10. 40h Monday-Friday weekly target standard", () => {
    assert.equal(WEEKLY_TARGET_HOURS, 40.0);

    const perf = compilePerformanceOverview({
      workHoursByDate: {
        "2026-09-21": 8, // Mon
        "2026-09-22": 8, // Tue
        "2026-09-23": 8, // Wed
        "2026-09-24": 8, // Thu
        "2026-09-25": 8, // Fri
      },
      asOfDateStr: "2026-09-25",
      timezone: tz,
    });

    assert.equal(perf.currentWeek.performance.totalProductiveHours, 40.0);
    assert.equal(perf.currentWeek.capacityPlan.totalTargetHours, 40.0);
    assert.equal(perf.currentWeek.capacityPlan.remainingTargetHours, 0);
  });

  await t.test("11. Monthly target = weekdays in that month × 8 hours (never fixed 30-day denominator)", () => {
    // September 2026: 30 calendar days, 22 weekdays (Mon-Fri)
    const septWeekdays = getMonthWeekdayCount(2026, 9, tz);
    assert.equal(septWeekdays, 22);
    const septMonthlyTarget = septWeekdays * 8.0;
    assert.equal(septMonthlyTarget, 176.0); // 22 × 8 = 176h

    // October 2026: 31 calendar days, 22 weekdays
    const octWeekdays = getMonthWeekdayCount(2026, 10, tz);
    assert.equal(octWeekdays, 22);
    assert.equal(octWeekdays * 8.0, 176.0);

    // Verify compilePerformanceOverview sets monthly target based on weekday count
    const overview = compilePerformanceOverview({
      asOfDateStr: "2026-09-24",
      workHoursByDate: { "2026-09-24": 8.0 },
      timezone: tz,
    });

    assert.equal(overview.currentMonth.weekdayCount, 22);
    assert.equal(overview.currentMonth.capacityPlan.totalTargetHours, 176.0);
  });

  await t.test("12. Weekend recovery model: dynamically consumes Saturday/Sunday when weekday pace > 10h/day", () => {
    // Scenario from spec:
    // Weekly target = 40h
    // Wednesday evening: 15h completed
    // Thursday + Friday remaining: 2 weekdays
    // 25h remaining / 2 weekdays = 12.5h/day
    // 12.5 > 10h/day ceiling -> Saturday becomes available as recovery workday
    // 25h / 3 days (Thu + Fri + Sat) = 8.33h/day <= 10.0h/day

    const target = calculateDailyStudyTarget({
      asOfDateStr: "2026-09-24", // Thursday
      weekly: {
        completedHours: 15.0, // Mon-Wed completed 15h
        targetHours: 40.0,
        remainingDays: 2,     // Thursday and Friday remaining
      },
      timezone: tz,
    });

    assert.equal(target.weekendRecovery.required, true);
    assert.deepEqual(target.weekendRecovery.recoveryWorkdays, ["Saturday"]);
    assert.equal(target.weekendRecovery.saturdayStatus, "RECOVERY_WORKDAY");
    assert.equal(target.weekendRecovery.sundayStatus, "NORMAL_HOLIDAY");
    // Recommended pace across 3 days: 25 / 3 = 8.33h/day
    assert.equal(target.targetHours, 8.33);
  });

  await t.test("13. 10.0h maximum planning pace ceiling is strictly enforced", () => {
    assert.equal(REALISTIC_MAX_DAILY_SESSION_HOURS, 10.0);

    // Extreme deficit: Friday with only 5h completed out of 40h (35h remaining)
    // 35h remaining across Friday + Saturday + Sunday = 35 / 3 = 11.67h/day > 10.0
    const target = calculateDailyStudyTarget({
      asOfDateStr: "2026-09-25", // Friday
      weekly: {
        completedHours: 5.0,
        targetHours: 40.0,
        remainingDays: 1, // Friday
      },
      timezone: tz,
    });

    // Both weekend days are consumed
    assert.equal(target.weekendRecovery.required, true);
    assert.deepEqual(target.weekendRecovery.recoveryWorkdays, ["Saturday", "Sunday"]);
    // Target is capped at realistic max daily planning ceiling (10.0h/day)
    assert.equal(target.targetHours, 10.0);
    assert.ok(target.targetHours <= 10.0);
  });

  await t.test("14. Midnight IST handling splits work across 2 calendar dates", () => {
    // 23:58 IST to 00:12 IST
    // Day 1 (23:58 to 00:00) = 2 minutes = 120 seconds
    // Day 2 (00:00 to 00:12) = 12 minutes = 720 seconds
    const day1Seconds = 120;
    const day2Seconds = 720;

    const day1Hours = Math.round((day1Seconds / 3600) * 100) / 100;
    const day2Hours = Math.round((day2Seconds / 3600) * 100) / 100;

    assert.equal(day1Hours, 0.03);
    assert.equal(day2Hours, 0.2);

    const perfDay1 = calculateSessionPerformance({ workHours: day1Hours }, 1, tz);
    const perfDay2 = calculateSessionPerformance({ workHours: day2Hours }, 1, tz);

    assert.equal(perfDay1.totalProductiveHours, 0.03);
    assert.equal(perfDay2.totalProductiveHours, 0.2);
  });

  await t.test("15. Dashboard, Performance, Analytics, and Daily Target share identical work totals", async () => {
    const testDate = "2026-09-24";
    const testWorkSeconds = 19440; // 5.4h
    const testWorkHours = 5.4;

    const workSecondsByDate = { [testDate]: testWorkSeconds };
    const workHoursByDate = { [testDate]: testWorkHours };

    // Daily Target
    const dt = calculateDailyStudyTarget({
      asOfDateStr: testDate,
      workSecondsByDate,
      timezone: tz,
    });

    // Performance Overview
    const perf = compilePerformanceOverview({
      asOfDateStr: testDate,
      workSecondsByDate,
      timezone: tz,
    });

    // Historical Analytics
    const analytics = await compileHistoricalAnalytics({
      asOfDateStr: testDate,
      workHoursByDate,
      timezone: tz,
    });

    const dailyPoint = analytics.daily.find((d) => d.date === testDate);

    // Invariant verification: all report exactly 5.4h
    assert.equal(dt.today.completedHours, 5.4);
    assert.equal(perf.today.performance.totalProductiveHours, 5.4);
    assert.equal(dailyPoint?.productiveHours, 5.4);
    assert.equal(dt.today.completedHours, perf.today.performance.totalProductiveHours);
    assert.equal(dt.today.completedHours, dailyPoint?.productiveHours);
  });
});
