import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateMonthCalendar,
  getEffectiveStatus,
  formatHoursMinutes,
  formatRequiredPace,
  formatDailyTarget,
} from "../lib/services/calendar/monthlyCalendar";

test("Monthly Calendar Planner — Core Calculation & Invariant Tests", async (t) => {
  const tz = "Asia/Kolkata";

  // 1. DEFAULT MONTH
  await t.test("1. Default month: Monday-Friday are WORKDAY, Saturday-Sunday are HOLIDAY", () => {
    // September 2026: 30 days (starts Tuesday, Sept 1; ends Wednesday, Sept 30)
    // 22 weekdays, 8 weekend days
    const result = calculateMonthCalendar({
      year: 2026,
      month: 9,
      asOfDateStr: "2026-09-01",
      timezone: tz,
    });

    assert.equal(result.totalDays, 30);
    assert.equal(result.plannedWorkdays, 22);
    assert.equal(result.plannedHolidays, 8);
    assert.equal(result.monthlyRequiredHours, 176); // 22 * 8 = 176

    // Check specific days
    const sept1 = result.days.find((d) => d.date === "2026-09-01"); // Tuesday
    assert.equal(sept1?.plannedStatus, "WORKDAY");
    assert.equal(sept1?.plannedAllocationHours, 8);

    const sept5 = result.days.find((d) => d.date === "2026-09-05"); // Saturday
    assert.equal(sept5?.plannedStatus, "HOLIDAY");
    assert.equal(sept5?.plannedAllocationHours, 0);

    const sept6 = result.days.find((d) => d.date === "2026-09-06"); // Sunday
    assert.equal(sept6?.plannedStatus, "HOLIDAY");
    assert.equal(sept6?.plannedAllocationHours, 0);

    const sept7 = result.days.find((d) => d.date === "2026-09-07"); // Monday
    assert.equal(sept7?.plannedStatus, "WORKDAY");
    assert.equal(sept7?.plannedAllocationHours, 8);
  });

  // 2. MONTH BOUNDARIES (28, 29, 30, 31 DAYS, STARTING MON / SUN)
  await t.test("2. Month boundaries: month starting on Monday (June 2026)", () => {
    // June 1, 2026 is Monday; 30 days; 22 weekdays, 8 weekend days
    const res = calculateMonthCalendar({ year: 2026, month: 6, timezone: tz });
    assert.equal(res.totalDays, 30);
    assert.equal(res.days[0].dayOfWeek, "Monday");
    assert.equal(res.days[0].plannedStatus, "WORKDAY");
    assert.equal(res.plannedWorkdays + res.plannedHolidays, 30);
  });

  await t.test("3. Month boundaries: month starting on Sunday (February 2026)", () => {
    // Feb 1, 2026 is Sunday; 28 days (non-leap); 20 weekdays, 8 weekend days
    const res = calculateMonthCalendar({ year: 2026, month: 2, timezone: tz });
    assert.equal(res.totalDays, 28);
    assert.equal(res.days[0].dayOfWeek, "Sunday");
    assert.equal(res.days[0].plannedStatus, "HOLIDAY");
    assert.equal(res.plannedWorkdays, 20);
    assert.equal(res.plannedHolidays, 8);
    assert.equal(res.monthlyRequiredHours, 160); // 20 * 8 = 160h
  });

  await t.test("4. Month boundaries: Leap Year February (2024)", () => {
    // Feb 2024 has 29 days (starts Thursday, ends Thursday)
    // 21 weekdays, 8 weekend days
    const res = calculateMonthCalendar({ year: 2024, month: 2, timezone: tz });
    assert.equal(res.totalDays, 29);
    assert.equal(res.plannedWorkdays, 21);
    assert.equal(res.plannedHolidays, 8);
    assert.equal(res.monthlyRequiredHours, 168);
  });

  await t.test("5. Month boundaries: 31-day month (October 2026)", () => {
    // October 2026: 31 days (starts Thursday, ends Saturday)
    // 22 weekdays, 9 weekend days
    const res = calculateMonthCalendar({ year: 2026, month: 10, timezone: tz });
    assert.equal(res.totalDays, 31);
    assert.equal(res.plannedWorkdays, 22);
    assert.equal(res.plannedHolidays, 9);
    assert.equal(res.monthlyRequiredHours, 176);
  });

  // 3. OVERRIDES
  await t.test("6. Overrides: Weekday -> Holiday reduces required hours by 8", () => {
    // Normally 22 workdays (176h). Changing Sept 25 (Friday) to HOLIDAY
    const res = calculateMonthCalendar({
      year: 2026,
      month: 9,
      overrides: {
        "2026-09-25": { status: "HOLIDAY", topic: "Trip" },
      },
      timezone: tz,
    });

    assert.equal(res.plannedWorkdays, 21);
    assert.equal(res.plannedHolidays, 9);
    assert.equal(res.monthlyRequiredHours, 168); // 21 * 8 = 168

    const day = res.days.find((d) => d.date === "2026-09-25");
    assert.equal(day?.plannedStatus, "HOLIDAY");
    assert.equal(day?.isOverridden, true);
    assert.equal(day?.topic, "Trip");
    assert.equal(day?.plannedAllocationHours, 0);
  });

  await t.test("7. Overrides: Weekend -> Workday increases required hours by 8", () => {
    // Normally 22 workdays (176h). Changing Sept 26 (Saturday) to WORKDAY
    const res = calculateMonthCalendar({
      year: 2026,
      month: 9,
      overrides: {
        "2026-09-26": { status: "WORKDAY", topic: "Recon Saturday" },
      },
      timezone: tz,
    });

    assert.equal(res.plannedWorkdays, 23);
    assert.equal(res.plannedHolidays, 7);
    assert.equal(res.monthlyRequiredHours, 184); // 23 * 8 = 184

    const day = res.days.find((d) => d.date === "2026-09-26");
    assert.equal(day?.plannedStatus, "WORKDAY");
    assert.equal(day?.isOverridden, true);
    assert.equal(day?.topic, "Recon Saturday");
    assert.equal(day?.plannedAllocationHours, 8);
  });

  await t.test("8. Overrides: Multiple overrides (move Friday off to Saturday)", () => {
    // Friday (Sept 25) -> HOLIDAY
    // Saturday (Sept 26) -> WORKDAY
    // Total planned workdays should remain 22, required hours remain 176
    const res = calculateMonthCalendar({
      year: 2026,
      month: 9,
      overrides: {
        "2026-09-25": { status: "HOLIDAY" },
        "2026-09-26": { status: "WORKDAY" },
      },
      timezone: tz,
    });

    assert.equal(res.plannedWorkdays, 22);
    assert.equal(res.plannedHolidays, 8);
    assert.equal(res.monthlyRequiredHours, 176);

    const fri = res.days.find((d) => d.date === "2026-09-25");
    const sat = res.days.find((d) => d.date === "2026-09-26");
    assert.equal(fri?.plannedStatus, "HOLIDAY");
    assert.equal(sat?.plannedStatus, "WORKDAY");
  });

  await t.test("9. Overrides: Topic without status change does not change plannedStatus", () => {
    // Tuesday Sept 1 is a WORKDAY by default. User sets a topic without changing status.
    const res = calculateMonthCalendar({
      year: 2026,
      month: 9,
      overrides: {
        "2026-09-01": { status: null, topic: "HubSpot access control" },
      },
      timezone: tz,
    });

    const day = res.days.find((d) => d.date === "2026-09-01");
    assert.equal(day?.plannedStatus, "WORKDAY");
    assert.equal(day?.plannedAllocationHours, 8);
    assert.equal(day?.topic, "HubSpot access control");
    assert.equal(day?.isOverridden, false); // Status is default
    assert.equal(res.plannedWorkdays, 22);
  });

  await t.test("10. Overrides: Status without topic sets topic to null", () => {
    const res = calculateMonthCalendar({
      year: 2026,
      month: 9,
      overrides: {
        "2026-09-25": { status: "HOLIDAY", topic: null },
      },
      timezone: tz,
    });

    const day = res.days.find((d) => d.date === "2026-09-25");
    assert.equal(day?.plannedStatus, "HOLIDAY");
    assert.equal(day?.topic, null);
  });

  // 4. MONTHLY CALCULATIONS & ACTUAL WORK TIME AGGREGATION
  await t.test("11. Monthly calculations: Aggregates actual work time correctly", () => {
    // Work seconds across 3 days:
    // Sept 1: 24,120s (6.7h = 6h 42m)
    // Sept 2: 28,800s (8.0h = 8h 00m)
    // Sept 3: 14,400s (4.0h = 4h 00m)
    // Total = 67,320s (18.7h = 18h 42m)
    const workSecondsMap = {
      "2026-09-01": 24120,
      "2026-09-02": 28800,
      "2026-09-03": 14400,
    };

    const res = calculateMonthCalendar({
      year: 2026,
      month: 9,
      workSecondsMap,
      asOfDateStr: "2026-09-04",
      timezone: tz,
    });

    assert.equal(res.actualWorkedSeconds, 67320);
    assert.equal(res.actualWorkedHours, 18.7);
    assert.equal(res.actualWorkedFormatted, "18h 42m");
    assert.equal(res.daysWorkedCount, 3);
    assert.equal(res.highestWorkDay?.date, "2026-09-02");
    assert.equal(res.highestWorkDay?.hours, 8.0);

    const d1 = res.days.find((d) => d.date === "2026-09-01");
    assert.equal(d1?.actualWorkFormatted, "6h 42m");
    assert.equal(d1?.actualWorkHours, 6.7);
  });

  // 5. WORK ON HOLIDAY
  await t.test("12. Work on Holiday remains visible and counted in actual work time", () => {
    // Sept 6 (Sunday) is a HOLIDAY
    // User works 3h 18m (11,880 seconds)
    const workSecondsMap = {
      "2026-09-06": 11880,
    };

    const res = calculateMonthCalendar({
      year: 2026,
      month: 9,
      workSecondsMap,
      asOfDateStr: "2026-09-07",
      timezone: tz,
    });

    const sunday = res.days.find((d) => d.date === "2026-09-06");
    assert.equal(sunday?.plannedStatus, "HOLIDAY");
    assert.equal(sunday?.actualWorkHours, 3.3);
    assert.equal(sunday?.actualWorkFormatted, "3h 18m");

    // Monthly actual work time includes work on holiday
    assert.equal(res.actualWorkedSeconds, 11880);
    assert.equal(res.actualWorkedHours, 3.3);
  });

  // 6. FRESH MONTH (NO CROSS-MONTH DEBT)
  await t.test("13. Fresh Month: September deficit does NOT carry into October", () => {
    // Suppose in September user only worked 100h out of 176h (76h deficit)
    const septRes = calculateMonthCalendar({
      year: 2026,
      month: 9,
      workSecondsMap: { "2026-09-01": 360000 }, // 100 hours
      asOfDateStr: "2026-10-01",
      timezone: tz,
    });
    assert.equal(septRes.remainingHours, 76);

    // October starts completely fresh
    const octRes = calculateMonthCalendar({
      year: 2026,
      month: 10,
      workSecondsMap: {},
      asOfDateStr: "2026-10-01",
      timezone: tz,
    });

    // October target is strictly based on October's 22 workdays = 176h
    // September's 76h deficit is NOT added!
    assert.equal(octRes.monthlyRequiredHours, 176);
    assert.equal(octRes.remainingHours, 176);
    assert.equal(octRes.actualWorkedHours, 0);
  });

  // 7. ZERO REMAINING WORKDAYS (NO NAN OR INFINITY)
  await t.test("14. Zero remaining workdays: Pace is 0, no NaN or Infinity", () => {
    // Month is finished or today is after the last workday
    const res = calculateMonthCalendar({
      year: 2026,
      month: 9,
      asOfDateStr: "2026-10-01", // Past month
      workSecondsMap: { "2026-09-01": 3600 },
      timezone: tz,
    });

    assert.equal(res.remainingWorkdays, 0);
    assert.equal(Number.isFinite(res.requiredDailyPace), true);
    assert.equal(isNaN(res.requiredDailyPace), false);
    assert.equal(res.requiredDailyPace, 0);
    assert.equal(res.requiredDailyPaceFormatted, "0h 00m");
  });

  await t.test("15. Pace calculation for current month matches spec example", () => {
    // Spec Section 10:
    // Workdays: 22, Required: 176h, Worked: 103h 24m (103.4h)
    // Remaining: 72h 36m (72.6h)
    // Remaining workdays: say 9 days
    // 72.6 / 9 = 8.0667h = 8h 04m
    const workedSeconds = Math.round(103.4 * 3600); // 103h 24m = 372240s
    // As of Sept 18 (Friday): Sept 18, 21, 22, 23, 24, 25, 28, 29, 30 = 9 workdays remaining
    const res = calculateMonthCalendar({
      year: 2026,
      month: 9,
      workSecondsMap: { "2026-09-01": workedSeconds },
      asOfDateStr: "2026-09-18",
      timezone: tz,
    });

    assert.equal(res.plannedWorkdays, 22);
    assert.equal(res.monthlyRequiredHours, 176);
    assert.equal(res.actualWorkedFormatted, "103h 24m");
    assert.equal(res.remainingHoursFormatted, "72h 36m");
    assert.equal(res.remainingWorkdays, 9);
    // 72.6 / 9 = 8.07h = 8h 04m
    assert.equal(res.requiredDailyPaceFormatted, "8h 04m");
  });

  // 8. DATABASE REPOSITORY & INTEGRATION TESTS
  await t.test("16. Database: Upsert, read, and delete calendar overrides", async () => {
    const {
      upsertCalendarOverride,
      getCalendarOverride,
      getCalendarOverridesBetween,
      deleteCalendarOverride,
    } = await import("../lib/repositories/calendarOverrides");

    const testDate = "2026-09-25"; // Friday (default WORKDAY)

    // Initially clean
    await deleteCalendarOverride(testDate);
    let record = await getCalendarOverride(testDate);
    assert.equal(record, null);

    // Override Friday to HOLIDAY with topic
    await upsertCalendarOverride(testDate, "HOLIDAY", "Long weekend trip");
    record = await getCalendarOverride(testDate);
    assert.equal(record?.status, "HOLIDAY");
    assert.equal(record?.topic, "Long weekend trip");

    // Overrides range query
    const range = await getCalendarOverridesBetween("2026-09-01", "2026-09-30");
    assert.equal(range[testDate]?.status, "HOLIDAY");

    // Setting back to default status (WORKDAY) with no topic deletes the row
    await upsertCalendarOverride(testDate, "WORKDAY", null);
    record = await getCalendarOverride(testDate);
    assert.equal(record, null); // Row was pruned!
  });

  await t.test("17. Database: getMonthCalendar loads real overrides and work_time_daily", async () => {
    const { getMonthCalendar, saveDayOverride, revertDayOverride } = await import(
      "../lib/services/calendar/monthlyCalendar"
    );
    const { upsertWorkTimeDaily } = await import("../lib/repositories/workTimeDaily");

    const testDate = "2026-09-25";
    // Set 6h 42m work in work_time_daily
    await upsertWorkTimeDaily(testDate, 24120);

    // Save override
    await saveDayOverride(testDate, "HOLIDAY", "HubSpot Conference");

    const calendar = await getMonthCalendar(2026, 9, "2026-09-25", tz);
    assert.equal(calendar.year, 2026);
    assert.equal(calendar.month, 9);
    assert.equal(calendar.totalDays, 30);
    assert.equal(calendar.plannedWorkdays, 21); // 1 weekday overridden to holiday

    const day = calendar.days.find((d) => d.date === testDate);
    assert.equal(day?.plannedStatus, "HOLIDAY");
    assert.equal(day?.topic, "HubSpot Conference");
    assert.equal(day?.actualWorkHours, 6.7);
    assert.equal(day?.actualWorkFormatted, "6h 42m");

    // Clean up
    await revertDayOverride(testDate);
  });

  await t.test("18. Report: generateMonthlyCalendarReport outputs canonical monthly summary", async () => {
    const { generateMonthlyCalendarReport } = await import(
      "../lib/services/calendar/monthlyCalendar"
    );

    const report = await generateMonthlyCalendarReport(2026, 9, "2026-09-25", tz);
    assert.equal(report.year, 2026);
    assert.equal(report.month, 9);
    assert.equal(report.monthName, "September");
    assert.equal(report.plannedWorkdays, 22);
    assert.equal(report.plannedHolidays, 8);
    assert.equal(report.requiredHours, 176);
    assert.ok(typeof report.actualWorkFormatted === "string");
    assert.ok(typeof report.averageHoursPerWorkdayFormatted === "string");
    assert.ok(typeof report.requiredDailyPaceFormatted === "string");
  });

  // 9. 10-HOUR CAP ON REQUIRED WORK ALLOCATION
  await t.test("19. 10-hour cap: formatRequiredPace and calculateMonthCalendar return '10+ hr needed' when pace >= 10", () => {
    assert.equal(formatRequiredPace(10.0), "10+ hr needed");
    assert.equal(formatRequiredPace(10.5), "10+ hr needed");
    assert.equal(formatRequiredPace(16.0), "10+ hr needed");
    assert.equal(formatRequiredPace(9.99), "9h 59m");
    assert.equal(formatRequiredPace(8.0), "8h 00m");

    // Case: Month with 2 remaining workdays, but 24 hours remaining -> 12h/day required
    // Work: 160h worked out of 184h required (say 23 workdays), 24h remaining across 2 remaining workdays
    const res = calculateMonthCalendar({
      year: 2026,
      month: 9,
      // As of Sept 29 (Tuesday): remaining workdays are Sept 29, Sept 30 (2 days)
      // Total required = 22 * 8 = 176h. Worked = 152h. Remaining = 24h.
      // Pace = 24 / 2 = 12h/day >= 10h cap -> "10+ hr needed"
      workSecondsMap: { "2026-09-01": 152 * 3600 },
      asOfDateStr: "2026-09-29",
      timezone: tz,
    });

    assert.equal(res.remainingWorkdays, 2);
    assert.equal(res.remainingHours, 24);
    assert.equal(res.requiredDailyPace, 12);
    assert.equal(res.requiredDailyPaceFormatted, "10+ hr needed");
  });

  await t.test("20. 10-hour cap: normal pace under 10h displays exact hours and minutes", () => {
    // 2 workdays left, 16h remaining -> 8h/day required
    const res = calculateMonthCalendar({
      year: 2026,
      month: 9,
      workSecondsMap: { "2026-09-01": 160 * 3600 },
      asOfDateStr: "2026-09-29",
      timezone: tz,
    });

    assert.equal(res.remainingWorkdays, 2);
    assert.equal(res.remainingHours, 16);
    assert.equal(res.requiredDailyPace, 8);
    assert.equal(res.requiredDailyPaceFormatted, "8h 00m");
  });

  await t.test("21. Fresh month invariant: each month is independent with no cross-month debt carried over", () => {
    // September has deficit: 0h worked out of 176h
    const sept = calculateMonthCalendar({
      year: 2026,
      month: 9,
      workSecondsMap: {},
      asOfDateStr: "2026-09-30",
      timezone: tz,
    });
    assert.equal(sept.actualWorkedHours, 0);
    assert.equal(sept.remainingHours, 176);

    // October starts completely fresh with standard required hours = plannedWorkdays * 8
    const oct = calculateMonthCalendar({
      year: 2026,
      month: 10,
      workSecondsMap: {},
      asOfDateStr: "2026-10-01",
      timezone: tz,
    });
    // October 2026 has 22 workdays (22 * 8 = 176h)
    assert.equal(oct.plannedWorkdays, 22);
    assert.equal(oct.monthlyRequiredHours, 176);
    assert.equal(oct.remainingHours, 176);
    assert.equal(oct.requiredDailyPace, 8); // 176 / 22 = 8h/day, zero deficit carried
    assert.equal(oct.requiredDailyPaceFormatted, "8h 00m");
  });

  // 10. DAILY TARGET PER-CELL DISTRIBUTION & 10-HOUR CAP TESTS (Section 11 Spec)
  await t.test("22. Fresh month per-cell targets: WORKDAY cells show 8h target, HOLIDAY cells show 0h target", () => {
    // September 2026: 30 days, 22 workdays (starts Sept 1, Tuesday)
    const res = calculateMonthCalendar({
      year: 2026,
      month: 9,
      asOfDateStr: "2026-09-01",
      timezone: tz,
    });

    const workdays = res.days.filter((d) => d.plannedStatus === "WORKDAY");
    const holidays = res.days.filter((d) => d.plannedStatus === "HOLIDAY");

    assert.equal(workdays.length, 22);
    assert.equal(holidays.length, 8);

    // Every WORKDAY in fresh month has Target: 8h
    for (const d of workdays) {
      assert.equal(d.dailyTargetHours, 8, `Workday ${d.date} must have 8h target`);
      assert.equal(d.dailyTargetFormatted, "Target: 8h", `Workday ${d.date} formatted must be Target: 8h`);
    }

    // Every HOLIDAY in fresh month has Target: 0h
    for (const d of holidays) {
      assert.equal(d.dailyTargetHours, 0, `Holiday ${d.date} must have 0h target`);
      assert.equal(d.dailyTargetFormatted, "Target: 0h", `Holiday ${d.date} formatted must be Target: 0h`);
    }
  });

  await t.test("23. Deficit distribution (Prompt Example 3): 160h required, 130h worked, 30h remaining across 5 workdays -> 6h target per remaining cell", () => {
    // Feb 2026 has 20 workdays (Feb 1 is Sunday, Feb 2-6 (5), Feb 9-13 (5), Feb 16-20 (5), Feb 23-27 (5))
    // Total required = 20 * 8 = 160h.
    // As of Feb 23 (Monday): 15 workdays in past (Feb 2-20), 5 remaining workdays (Feb 23-27).
    // Actual work completed = 130h. Remaining required work = 30h. Remaining WORKDAYs = 5.
    // Target for each of the 5 remaining WORKDAYs = 30 / 5 = 6h.
    const res = calculateMonthCalendar({
      year: 2026,
      month: 2,
      workSecondsMap: { "2026-02-02": 130 * 3600 },
      asOfDateStr: "2026-02-23",
      timezone: tz,
    });

    assert.equal(res.monthlyRequiredHours, 160);
    assert.equal(res.actualWorkedHours, 130);
    assert.equal(res.remainingHours, 30);
    assert.equal(res.remainingWorkdays, 5);
    assert.equal(res.requiredDailyPace, 6);
    assert.equal(res.requiredDailyPaceFormatted, "6h 00m");

    // All 5 remaining workdays (Feb 23, 24, 25, 26, 27) must show Target: 6h
    const remainingWorkdays = res.days.filter((d) => d.date >= "2026-02-23" && d.plannedStatus === "WORKDAY");
    assert.equal(remainingWorkdays.length, 5);
    for (const d of remainingWorkdays) {
      assert.equal(d.dailyTargetHours, 6, `Remaining workday ${d.date} target must be 6h`);
      assert.equal(d.dailyTargetFormatted, "Target: 6h", `Remaining workday ${d.date} must display Target: 6h`);
    }

    // Historical completed workdays (Feb 2..20) must retain standard Target: 8h
    const pastWorkdays = res.days.filter((d) => d.date < "2026-02-23" && d.plannedStatus === "WORKDAY");
    assert.equal(pastWorkdays.length, 15);
    for (const d of pastWorkdays) {
      assert.equal(d.dailyTargetHours, 8, `Past workday ${d.date} must retain 8h target`);
      assert.equal(d.dailyTargetFormatted, "Target: 8h", `Past workday ${d.date} must display Target: 8h`);
    }

    // Holidays (weekends) must retain Target: 0h
    const holidays = res.days.filter((d) => d.plannedStatus === "HOLIDAY");
    for (const d of holidays) {
      assert.equal(d.dailyTargetHours, 0);
      assert.equal(d.dailyTargetFormatted, "Target: 0h");
    }
  });

  await t.test("24. Dynamic redistribution: when actual work increases, deficit decreases and per-day target recalculates", () => {
    // 5 remaining workdays (Feb 23-27).
    // If user works 10h on Feb 23, total work becomes 140h.
    // As of Feb 24 (Tuesday): remaining workdays are 4 (Feb 24-27).
    // Remaining hours = 160 - 140 = 20h. Remaining workdays = 4.
    // Target for each of the 4 remaining workdays = 20 / 4 = 5h.
    const res = calculateMonthCalendar({
      year: 2026,
      month: 2,
      workSecondsMap: {
        "2026-02-02": 130 * 3600,
        "2026-02-23": 10 * 3600,
      },
      asOfDateStr: "2026-02-24",
      timezone: tz,
    });

    assert.equal(res.monthlyRequiredHours, 160);
    assert.equal(res.actualWorkedHours, 140);
    assert.equal(res.remainingHours, 20);
    assert.equal(res.remainingWorkdays, 4);
    assert.equal(res.requiredDailyPace, 5);
    assert.equal(res.requiredDailyPaceFormatted, "5h 00m");

    const remainingWorkdays = res.days.filter((d) => d.date >= "2026-02-24" && d.plannedStatus === "WORKDAY");
    assert.equal(remainingWorkdays.length, 4);
    for (const d of remainingWorkdays) {
      assert.equal(d.dailyTargetHours, 5);
      assert.equal(d.dailyTargetFormatted, "Target: 5h");
    }

    // Yesterday Feb 23 is now past and retains 8h historical target
    const feb23 = res.days.find((d) => d.date === "2026-02-23");
    assert.equal(feb23?.isPast, true);
    assert.equal(feb23?.dailyTargetHours, 8);
    assert.equal(feb23?.dailyTargetFormatted, "Target: 8h");
  });

  await t.test("25. Holidays: excluded from deficit distribution and receive 0h target", () => {
    // 5 days left in Feb 2026 (Feb 23-27).
    // User marks Feb 25 (Wednesday) as HOLIDAY.
    // Now remaining workdays = 4 (Feb 23, 24, 26, 27).
    // Planned workdays in month decreases from 20 to 19 -> required = 19 * 8 = 152h.
    // Completed = 120h. Remaining = 32h across 4 remaining workdays -> 8h/day.
    const res = calculateMonthCalendar({
      year: 2026,
      month: 2,
      overrides: {
        "2026-02-25": { status: "HOLIDAY", topic: "Day Off" },
      },
      workSecondsMap: { "2026-02-02": 120 * 3600 },
      asOfDateStr: "2026-02-23",
      timezone: tz,
    });

    assert.equal(res.plannedWorkdays, 19);
    assert.equal(res.monthlyRequiredHours, 152);
    assert.equal(res.remainingHours, 32);
    assert.equal(res.remainingWorkdays, 4);

    const feb25 = res.days.find((d) => d.date === "2026-02-25");
    assert.equal(feb25?.plannedStatus, "HOLIDAY");
    assert.equal(feb25?.dailyTargetHours, 0);
    assert.equal(feb25?.dailyTargetFormatted, "Target: 0h");

    const remainingWorkdays = res.days.filter((d) => d.date >= "2026-02-23" && d.plannedStatus === "WORKDAY");
    assert.equal(remainingWorkdays.length, 4);
    for (const d of remainingWorkdays) {
      assert.equal(d.dailyTargetHours, 8);
      assert.equal(d.dailyTargetFormatted, "Target: 8h");
    }
  });

  await t.test("26. 10-hour cap in day cells: calculated target >= 10h displays '10+ hr needed'", () => {
    // 2 workdays left (Sept 29, 30), 24h remaining -> 12h/day
    const res = calculateMonthCalendar({
      year: 2026,
      month: 9,
      workSecondsMap: { "2026-09-01": 152 * 3600 },
      asOfDateStr: "2026-09-29",
      timezone: tz,
    });

    assert.equal(res.remainingWorkdays, 2);
    assert.equal(res.requiredDailyPace, 12);
    assert.equal(res.requiredDailyPaceFormatted, "10+ hr needed");

    const sept29 = res.days.find((d) => d.date === "2026-09-29");
    const sept30 = res.days.find((d) => d.date === "2026-09-30");

    assert.equal(sept29?.dailyTargetHours, 12);
    assert.equal(sept29?.dailyTargetFormatted, "10+ hr needed");
    assert.equal(sept30?.dailyTargetHours, 12);
    assert.equal(sept30?.dailyTargetFormatted, "10+ hr needed");
  });

  await t.test("27. Calendar UI preservation: MonthlyCalendarView defines 7-column grid layout and no list layout", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const viewCode = await fs.readFile(
      path.join(process.cwd(), "components", "calendar", "MonthlyCalendarView.tsx"),
      "utf-8"
    );

    // Verify 7-column grid headers and grid styling
    assert.ok(viewCode.includes("grid-cols-7"), "Must use grid-cols-7 layout");
    assert.ok(
      viewCode.includes('gridTemplateColumns: "repeat(7, minmax(0, 1fr))"'),
      "Must have explicit 7-column inline CSS grid style"
    );
    assert.ok(viewCode.includes("overflow-x-auto"), "Must have horizontal scroll preservation wrapper");
    assert.ok(viewCode.includes("min-w-[700px]"), "Must have minimum width for 7 columns");

    // Verify day cell displays distributed target
    assert.ok(viewCode.includes("day.dailyTargetFormatted"), "Day cell must display dailyTargetFormatted");

    // Verify weekday headers
    const weekdayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (const h of weekdayHeaders) {
      assert.ok(viewCode.includes(`"${h}"`), `Must include weekday header ${h}`);
    }
  });
});



