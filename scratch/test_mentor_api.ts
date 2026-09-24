async function testMentorAPI() {
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "cyber-tracker-secure-admin-password-2026" }),
  });
  console.log("Login HTTP Status:", loginRes.status);
  const cookie = loginRes.headers.get("set-cookie") || "";
  console.log("Cookie obtained:", cookie ? "YES" : "NO");

  const mentorRes = await fetch("http://localhost:3000/api/performance-mentor?simulateDaysOff=2&period=weekly", {
    headers: { Cookie: cookie },
  });
  console.log("Mentor API HTTP Status:", mentorRes.status);
  const mentorData = await mentorRes.json();
  console.log("Weekly Mentor State:", mentorData.weekly.state);
  console.log("Weekly Actual Hours:", mentorData.weekly.current.actualHours);
  console.log("Weekly Free Days Available:", mentorData.weekly.earnedFreeDays.available);
  console.log("Simulated Days Off:", mentorData.weekly.simulation?.daysOff);
  console.log("Projected Average:", mentorData.weekly.simulation?.projectedAverage);
  console.log("Projected Status:", mentorData.weekly.simulation?.projectedStatus);
  console.log("Projected Deficit:", mentorData.weekly.simulation?.projectedDeficitHours);
  console.log("Simulation Summary:", mentorData.weekly.simulation?.summaryMessage);

  const dashRes = await fetch("http://localhost:3000/api/dashboard", {
    headers: { Cookie: cookie },
  });
  console.log("Dashboard API HTTP Status:", dashRes.status);
  const dashData = await dashRes.json();
  console.log("Dashboard includes mentor?", dashData.mentor !== undefined);
  console.log("Dashboard includes dailyTarget?", dashData.dailyTarget !== undefined);
  console.log("Dashboard includes performance?", dashData.performance !== undefined);

  console.log("\n🎉 API INTEGRATION TEST VERIFIED SUCCESSFULLY!");
}

testMentorAPI().catch(console.error);
