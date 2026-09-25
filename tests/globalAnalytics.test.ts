import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { calculateGlobalAnalytics } from "../lib/services/analytics/globalAnalytics";
import type { WorkTimeDailyRecord } from "../lib/repositories/workTimeDaily";

test("Global Analytics — Calculation & Invariant Tests", async (t) => {
  const tz = "Asia/Kolkata";

  // 1. EMPTY DATASET
  await t.test("1. Empty dataset handled gracefully with zero values and no NaN/Infinity", () => {
    const res = calculateGlobalAnalytics({
      records: [],
      range: "all",
      asOfDateStr: "2026-09-25",
      timezone: tz,
    });

    assert.equal(res.totalActiveSeconds, 0);
    assert.equal(res.totalWorkHours, 0);
    assert.equal(res.totalWorkFormatted, "0h 00m");
    assert.equal(res.trackedDaysCount, 0);
    assert.equal(res.activeDaysCount, 0);
    assert.equal(res.averagePerTrackedDayHours, 0);
    assert.equal(res.averagePerTrackedDayFormatted, "0h 00m");
    assert.equal(res.averagePerWorkdayHours, 0);
    assert.equal(res.planCompletionPercentage, 0);
    assert.equal(res.highestDay, null);
    assert.equal(res.lowestActiveDay, null);
    assert.equal(res.currentStreakDays, 0);
    assert.equal(res.monthlyTrends.length, 0);
  });

  // 2. SINGLE DAY DATASET
  await t.test("2. Single-day dataset calculation", () => {
    const records: WorkTimeDailyRecord[] = [
      { date: "2026-09-18", active_seconds: 34920, source: "windows_agent" }, // 9.7h = 9h 42m
    ];

    const res = calculateGlobalAnalytics({
      records,
      range: "all",
      asOfDateStr: "2026-09-25",
      timezone: tz,
    });

    assert.equal(res.totalActiveSeconds, 34920);
    assert.equal(res.totalWorkHours, 9.7);
    assert.equal(res.totalWorkFormatted, "9h 42m");
    assert.equal(res.trackedDaysCount, 1);
    assert.equal(res.activeDaysCount, 1);
    assert.equal(res.averagePerTrackedDayHours, 9.7);
    assert.equal(res.averagePerTrackedDayFormatted, "9h 42m");

    // Highest and lowest are identical for single day
    assert.equal(res.highestDay?.date, "2026-09-18");
    assert.equal(res.highestDay?.formattedDuration, "9h 42m");
    assert.equal(res.lowestActiveDay?.date, "2026-09-18");
    assert.equal(res.lowestActiveDay?.formattedDuration, "9h 42m");

    // September 2026 has 22 planned workdays (176h)
    assert.equal(res.plannedWorkdaysCount, 22);
    assert.equal(res.totalPlannedHours, 176);
    // Average per planned workday: 9.7 / 22 = 0.44h = 0h 26m
    assert.equal(res.averagePerWorkdayHours, 0.44);
    assert.equal(res.averagePerWorkdayFormatted, "0h 26m");
  });

  // 3. CORE GLOBAL METRICS & MULTI-DAY AVERAGES
  await t.test("3. Total work time, average per day, and lowest/highest active day", () => {
    const records: WorkTimeDailyRecord[] = [
      { date: "2026-09-01", active_seconds: 28800, source: "windows_agent" }, // 8.0h = 8h 00m
      { date: "2026-09-02", active_seconds: 14400, source: "windows_agent" }, // 4.0h = 4h 00m
      { date: "2026-09-03", active_seconds: 0, source: "windows_agent" },     // 0.0h (tracked day with 0 work)
      { date: "2026-09-04", active_seconds: 36000, source: "windows_agent" }, // 10.0h = 10h 00m
    ];

    const res = calculateGlobalAnalytics({
      records,
      range: "all",
      asOfDateStr: "2026-09-05",
      timezone: tz,
    });

    // Total = 79,200s (22.0h)
    assert.equal(res.totalActiveSeconds, 79200);
    assert.equal(res.totalWorkHours, 22.0);
    assert.equal(res.totalWorkFormatted, "22h 00m");

    // Tracked days = 4 (including the 0h day)
    assert.equal(res.trackedDaysCount, 4);
    // Active days = 3 (only days with > 0s)
    assert.equal(res.activeDaysCount, 3);

    // Average per tracked day = 22.0h / 4 = 5.5h = 5h 30m
    assert.equal(res.averagePerTrackedDayHours, 5.5);
    assert.equal(res.averagePerTrackedDayFormatted, "5h 30m");

    // Highest Day: Sept 4 with 10.0h
    assert.equal(res.highestDay?.date, "2026-09-04");
    assert.equal(res.highestDay?.hours, 10.0);

    // Lowest Active Day: Sept 2 with 4.0h (Sept 3 with 0h is NOT lowest active day)
    assert.equal(res.lowestActiveDay?.date, "2026-09-02");
    assert.equal(res.lowestActiveDay?.hours, 4.0);
  });

  // 4. MULTIPLE MONTHS & MONTHLY AGGREGATION
  await t.test("4. Multiple months aggregation matches specification", () => {
    const records: WorkTimeDailyRecord[] = [
      // August: 151h 08m (544,080s)
      { date: "2026-08-10", active_seconds: 544080, source: "windows_agent" },
      // September: 137h 24m (494,640s)
      { date: "2026-09-15", active_seconds: 494640, source: "windows_agent" },
    ];

    const res = calculateGlobalAnalytics({
      records,
      range: "all",
      asOfDateStr: "2026-09-25",
      timezone: tz,
    });

    assert.equal(res.monthlyTrends.length, 2);

    // September (first in reverse chronological)
    const sept = res.monthlyTrends.find((m) => m.month === "2026-09");
    assert.ok(sept);
    assert.equal(sept?.actualFormatted, "137h 24m");
    assert.equal(sept?.plannedWorkdays, 22);
    assert.equal(sept?.plannedHours, 176);

    // August
    const aug = res.monthlyTrends.find((m) => m.month === "2026-08");
    assert.ok(aug);
    assert.equal(aug?.actualFormatted, "151h 08m");
    assert.equal(aug?.plannedWorkdays, 21); // Aug 2026 has 21 weekdays
    assert.equal(aug?.plannedHours, 168);

    // Combined planned workdays = 22 + 21 = 43
    assert.equal(res.plannedWorkdaysCount, 43);
    assert.equal(res.totalPlannedHours, 344);
  });

  // 5. WORK ON HOLIDAY REMAINS ACTUAL WORK
  await t.test("5. Work on Holiday remains actual work and does not change based on planned status", () => {
    // Sept 6, 2026 is Sunday (default HOLIDAY)
    // Sept 26, 2026 is Saturday (overridden to HOLIDAY)
    const records: WorkTimeDailyRecord[] = [
      { date: "2026-09-06", active_seconds: 11880, source: "windows_agent" }, // 3.3h = 3h 18m on Sunday
    ];

    const res = calculateGlobalAnalytics({
      records,
      range: "all",
      asOfDateStr: "2026-09-25",
      timezone: tz,
    });

    // Actual work time includes holiday work normally
    assert.equal(res.totalActiveSeconds, 11880);
    assert.equal(res.totalWorkHours, 3.3);
    assert.equal(res.totalWorkFormatted, "3h 18m");
    assert.equal(res.activeDaysCount, 1);
  });

  // 6. CALENDAR OVERRIDES AFFECT PLANNED HOURS BUT NEVER ACTUAL WORK
  await t.test("6. Calendar overrides modify planned hours but NEVER alter actual work time", () => {
    const records: WorkTimeDailyRecord[] = [
      { date: "2026-09-25", active_seconds: 28800, source: "windows_agent" }, // 8.0h
    ];

    // Case A: Default calendar (22 workdays = 176h)
    const resDefault = calculateGlobalAnalytics({
      records,
      range: "all",
      asOfDateStr: "2026-09-25",
      timezone: tz,
    });
    assert.equal(resDefault.totalWorkHours, 8.0);
    assert.equal(resDefault.totalPlannedHours, 176);

    // Case B: Overriding Sept 25 (Friday) to HOLIDAY
    // Planned workdays reduces from 22 to 21 (168h), but actual work remains exactly 8.0h!
    const resOverridden = calculateGlobalAnalytics({
      records,
      overrides: {
        "2026-09-25": "HOLIDAY",
      },
      range: "all",
      asOfDateStr: "2026-09-25",
      timezone: tz,
    });
    assert.equal(resOverridden.totalWorkHours, 8.0); // Exact same actual work!
    assert.equal(resOverridden.totalPlannedHours, 168); // Planned hours adjusted
  });

  // 7. DATE RANGE FILTERS
  await t.test("7. Date range filter: this_year vs prev_year", () => {
    const records: WorkTimeDailyRecord[] = [
      { date: "2025-11-15", active_seconds: 14400, source: "windows_agent" }, // 4.0h (2025)
      { date: "2026-09-15", active_seconds: 28800, source: "windows_agent" }, // 8.0h (2026)
    ];

    // Filter to this_year (2026)
    const resThisYear = calculateGlobalAnalytics({
      records,
      range: "this_year",
      asOfDateStr: "2026-09-25",
      timezone: tz,
    });
    assert.equal(resThisYear.totalWorkHours, 8.0);
    assert.equal(resThisYear.trackedDaysCount, 1);

    // Filter to prev_year (2025)
    const resPrevYear = calculateGlobalAnalytics({
      records,
      range: "prev_year",
      asOfDateStr: "2026-09-25",
      timezone: tz,
    });
    assert.equal(resPrevYear.totalWorkHours, 4.0);
    assert.equal(resPrevYear.trackedDaysCount, 1);

    // All Time
    const resAll = calculateGlobalAnalytics({
      records,
      range: "all",
      asOfDateStr: "2026-09-25",
      timezone: tz,
    });
    assert.equal(resAll.totalWorkHours, 12.0);
    assert.equal(resAll.trackedDaysCount, 2);
  });

  // 8. NO CROSS-MONTH DEBT
  await t.test("8. No cross-month debt or recovery logic in analytics", () => {
    const records: WorkTimeDailyRecord[] = [
      { date: "2026-08-15", active_seconds: 36000, source: "windows_agent" }, // 10h in August (deficit vs 168h)
      { date: "2026-09-15", active_seconds: 36000, source: "windows_agent" }, // 10h in September
    ];

    const res = calculateGlobalAnalytics({
      records,
      range: "all",
      asOfDateStr: "2026-09-25",
      timezone: tz,
    });

    const sept = res.monthlyTrends.find((m) => m.month === "2026-09");
    const aug = res.monthlyTrends.find((m) => m.month === "2026-08");

    // Each month's planned hours is strictly its own (22*8 = 176h, 21*8 = 168h)
    assert.equal(sept?.plannedHours, 176);
    assert.equal(aug?.plannedHours, 168);
    // Zero accumulated deficit added to September
  });

  // 9. ACTIVE TRACKING STREAK
  await t.test("9. Current tracking streak calculates consecutive active work days up to asOfDate", () => {
    // Sept 23 (active), Sept 24 (active), Sept 25 (active) -> streak = 3
    const records: WorkTimeDailyRecord[] = [
      { date: "2026-09-20", active_seconds: 28800, source: "windows_agent" },
      // Gap on Sept 21 & Sept 22
      { date: "2026-09-23", active_seconds: 28800, source: "windows_agent" },
      { date: "2026-09-24", active_seconds: 28800, source: "windows_agent" },
      { date: "2026-09-25", active_seconds: 14400, source: "windows_agent" },
    ];

    const res = calculateGlobalAnalytics({
      records,
      range: "all",
      asOfDateStr: "2026-09-25",
      timezone: tz,
    });

    assert.equal(res.currentStreakDays, 3);
  });

  // 10. REVIEWS ROUTE NO LONGER PART OF ACTIVE NAVIGATION
  await t.test("10. Reviews route is completely removed from navigation and redirected", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    // 1. TopNavbar verification
    const topNavbarPath = path.resolve(process.cwd(), "components/dashboard/TopNavbar.tsx");
    const navbarContent = fs.readFileSync(topNavbarPath, "utf-8");
    assert.equal(navbarContent.includes("/reviews"), false, "TopNavbar must not link to /reviews");
    assert.equal(navbarContent.includes('"Reviews"'), false, "TopNavbar must not contain Reviews label");
    assert.ok(navbarContent.includes('href: "/"'), "TopNavbar links to Calendar");
    assert.ok(navbarContent.includes('href: "/analytics"'), "TopNavbar links to Analytics");
    assert.ok(navbarContent.includes('href="/settings"'), "TopNavbar links to Settings");

    // 2. Next.js redirects verification
    const nextConfigPath = path.resolve(process.cwd(), "next.config.js");
    const nextConfigContent = fs.readFileSync(nextConfigPath, "utf-8");
    assert.ok(nextConfigContent.includes("source: '/reviews'"), "next.config.js redirects /reviews");
    assert.ok(nextConfigContent.includes("source: '/reviews/:path*'"), "next.config.js redirects /reviews/:path*");

    // 3. app/reviews directory removed
    const appReviewsPath = path.resolve(process.cwd(), "app/reviews");
    assert.equal(fs.existsSync(appReviewsPath), false, "app/reviews directory must not exist");
  });
});

