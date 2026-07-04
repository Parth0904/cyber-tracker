import { NextResponse } from "next/server";

import {
  getAllDailyEntries,
} from "@/lib/repositories/dailyEntries";

import {
  getAllActivities,
} from "@/lib/repositories/activities";

import {
  getAllFindings,
} from "@/lib/repositories/targetFindings";

import {
  getAllTargetsWithArchived,
} from "@/lib/repositories/targets";

import {
  buildReportSummary,
} from "@/lib/reports";

import {
  generateWeeklyReport,
} from "@/lib/reports";

import {
  generateMonthlyReport,
} from "@/lib/reports";

import {
  generateYearlyReport,
} from "@/lib/reports";
import { generateRecommendations } from "@/lib/reports/recommendations";

export async function GET() {
  const entries = getAllDailyEntries();
  const activities = getAllActivities();
  const findings = getAllFindings();
  const targets = getAllTargetsWithArchived();

  const summary = buildReportSummary(entries, activities);
  const yearly = generateYearlyReport(summary);
  const monthly = generateMonthlyReport(summary);
  const recommendations = generateRecommendations(monthly);
  const weekly = generateWeeklyReport(summary);

  // Map findings to timeline nodes:
  const timeline = findings.map(f => {
    const target = targets.find(t => t.id === f.target_id);
    return {
      id: String(f.id),
      targetName: target ? target.name : "Unknown Target",
      findingTitle: f.title,
      status: f.status,
      severity: f.severity,
      reward: f.reward,
      submittedAt: f.submitted_at,
      resolutionText: f.notes || ""
    };
  });

  // Calculate metrics:
  const totalSubmitted = findings.length;
  const validCount = findings.filter(f => ["Valid", "Resolved", "Triaged"].includes(f.status)).length;
  const duplicateCount = findings.filter(f => f.status === "Duplicate").length;
  const informativeCount = findings.filter(f => f.status === "Informative").length;
  const grossBounty = findings.reduce((sum, f) => sum + (f.reward || 0), 0);
  const averageBounty = totalSubmitted > 0 ? grossBounty / totalSubmitted : 0;
  const successRate = totalSubmitted > 0 ? Math.round((validCount / totalSubmitted) * 100) : 0;

  const metrics = {
    totalSubmitted,
    validCount,
    duplicateCount,
    informativeCount,
    grossBounty,
    averageBounty,
    successRate
  };

  // achievements:
  const achievements = findings.length > 0 ? [
    { title: "First Blood", desc: "First confirmed valid disclosure report.", date: findings[findings.length - 1].submitted_at.split("T")[0] }
  ] : [];

  // insights:
  const insights = findings.length > 0 ? [
    "Most productive findings are discovered after a high focus day.",
    "Target testing consistency leads to a higher valid yield rate."
  ] : [];

  // chartData: Group rewards by submitted_at date (split by 'T' or string) or months:
  const chartData = findings.slice().reverse().map(f => ({
    label: f.submitted_at ? f.submitted_at.split("T")[0] : "-",
    value: f.reward || 0
  }));

  return NextResponse.json({
    summary,
    weekly,
    monthly,
    yearly,
    recommendations,
    metrics,
    timeline,
    achievements,
    insights,
    chartData,
  });
}