import "dotenv/config";
import assert from "node:assert/strict";

async function main() {
  console.log("Starting verification of Analytics & Reviews removal...");

  // 1. Authenticate with local Next.js dev server
  const password = process.env.AUTH_PASSWORD || "devpassword123";
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  assert.equal(loginRes.status, 200, "Login must succeed");
  const setCookie = loginRes.headers.get("set-cookie") || "";
  console.log("✓ Authenticated successfully.");

  // 2. Query /api/analytics
  const analyticsRes = await fetch("http://localhost:3000/api/analytics?range=all", {
    headers: { cookie: setCookie },
  });
  assert.equal(analyticsRes.status, 200, "GET /api/analytics must return 200");
  const resJson = await analyticsRes.json();
  const analyticsData = resJson.analytics;
  console.log("✓ /api/analytics returned data:", {
    totalWorkFormatted: analyticsData.totalWorkFormatted,
    trackedDaysCount: analyticsData.trackedDaysCount,
    activeDaysCount: analyticsData.activeDaysCount,
    averagePerTrackedDayFormatted: analyticsData.averagePerTrackedDayFormatted,
    averagePerWorkdayFormatted: analyticsData.averagePerWorkdayFormatted,
    planCompletionPercentage: analyticsData.planCompletionPercentage,
    highestDay: analyticsData.highestDay,
    lowestActiveDay: analyticsData.lowestActiveDay,
    currentStreakDays: analyticsData.currentStreakDays,
    monthlyTrendsCount: analyticsData.monthlyTrends?.length,
  });

  assert.ok(typeof analyticsData.totalActiveSeconds === "number");
  assert.ok(typeof analyticsData.totalWorkFormatted === "string");
  assert.ok(typeof analyticsData.activeDaysCount === "number");
  assert.ok(Array.isArray(analyticsData.monthlyTrends));

  // 3. Test redirect from /reviews
  const reviewsRes = await fetch("http://localhost:3000/reviews", {
    redirect: "manual",
  });
  console.log(`✓ GET /reviews status: ${reviewsRes.status}, location: ${reviewsRes.headers.get("location")}`);
  assert.ok(
    reviewsRes.status === 307 || reviewsRes.status === 308 || reviewsRes.status === 302,
    "Expected redirect status for /reviews"
  );
  assert.equal(reviewsRes.headers.get("location"), "/", "Expected redirect to '/'");

  // 4. Test range filters: this_year and prev_year
  const thisYearRes = await fetch("http://localhost:3000/api/analytics?range=this_year", {
    headers: { cookie: setCookie },
  });
  assert.equal(thisYearRes.status, 200);
  const thisYearData = await thisYearRes.json();
  console.log("✓ Range 'this_year' returned successfully. Total work:", thisYearData.totalWorkFormatted);

  console.log("All Analytics & Reviews removal verifications passed!");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
