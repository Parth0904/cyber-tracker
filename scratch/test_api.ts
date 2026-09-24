import "dotenv/config";

async function main() {
  const password = process.env.AUTH_PASSWORD || "admin";
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  console.log("Login status:", loginRes.status);
  const cookie = loginRes.headers.get("set-cookie");

  const targetRes = await fetch("http://localhost:3000/api/daily-target", {
    headers: { cookie: cookie || "" },
  });
  console.log("/api/daily-target status:", targetRes.status);
  const targetData = await targetRes.json();
  console.log("Target Response:", JSON.stringify({
    targetHours: targetData.targetHours,
    targetSource: targetData.targetSource,
    explanation: targetData.explanation,
    today: targetData.today,
    weekly: targetData.weekly,
    weekendRecovery: targetData.weekendRecovery,
  }, null, 2));

  const dashRes = await fetch("http://localhost:3000/api/dashboard", {
    headers: { cookie: cookie || "" },
  });
  console.log("/api/dashboard status:", dashRes.status);
  const dashData = await dashRes.json();
  console.log("Dashboard completion:", JSON.stringify(dashData.completion, null, 2));
  console.log("Dashboard dailyTarget present:", !!dashData.dailyTarget);
  console.log("Dashboard reading/workout present:", "reading" in dashData || "workout" in dashData);
}

main().catch(console.error);
