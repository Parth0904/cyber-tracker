import { NextResponse } from "next/server";

function calculateImpact(values: number[]) {
  const valid = values.filter((v) => v > 0);

  if (valid.length < 2) {
    return 0;
  }

  const best = Math.max(...valid);
  const worst = Math.min(...valid);

  return Math.round(((best - worst) / worst) * 100);
}

function confidence(days: number) {
  if (days >= 14) return "High";
  if (days >= 5) return "Medium";
  return "Low";
}

export async function GET() {
  const habits = [];

  const endpoints = [
    {
      name: "Sleep",
      url: "http://localhost:3000/api/insights/sleep",
    },
    {
      name: "Workout",
      url: "http://localhost:3000/api/insights/workout",
    },
    {
      name: "Wake Time",
      url: "http://localhost:3000/api/insights/wake-time",
    },
    {
      name: "No Screen Before Bed",
      url: "http://localhost:3000/api/insights/no-screen",
    },
    {
      name: "Reading Before Bed",
      url: "http://localhost:3000/api/insights/reading-before-bed",
    },
    {
      name: "Learning Hours",
      url: "http://localhost:3000/api/insights/learning",
    },
    {
      name: "Bug Report Study",
      url: "http://localhost:3000/api/insights/bug-study",
    },
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint.url);
      const data = await res.json();

      const buckets = Object.values(data) as any[];

      const averages = buckets.map((b) => b.average || 0);

      const totalDays = buckets.reduce(
        (acc, b) => acc + (b.days || 0),
        0
      );

      habits.push({
        name: endpoint.name,
        impact: calculateImpact(averages),
        confidence: confidence(totalDays),
      });
    } catch {
      continue;
    }
  }

  habits.sort((a, b) => b.impact - a.impact);

  const best = habits[0] || {
    name: "No Data",
    impact: 0,
    confidence: "Low",
  };

  const worst = habits[habits.length - 1] || {
    name: "No Data",
    impact: 0,
    confidence: "Low",
  };

  return NextResponse.json({
    bestHabit: best.name,
    bestImpact: best.impact,
    bestConfidence: best.confidence,

    worstHabit: worst.name,
    worstImpact: worst.impact,
    worstConfidence: worst.confidence,
  });
}