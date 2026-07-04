"use client";

import * as React from "react";
import { MetricCard } from "@/components/ui/MetricCard";

type StatsData = {
  currentStreak: number;
  allTimeHigh: number;
  completionRate: number;
  hoursInvested: number;
  findingsCount: number;
};

type DashboardStatsProps = {
  stats?: StatsData; // Made optional to prevent runtime parent crashes
};

export default function DashboardStats({ stats }: DashboardStatsProps) {
  // Safe extraction with default fallback values if stats object is undefined
  const {
    currentStreak = 0,
    allTimeHigh = 0,
    completionRate = 0,
    hoursInvested = 0,
    findingsCount = 0,
  } = stats || {};

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Current Hunting Streak"
        value={`${currentStreak} Days`}
        description={`Personal best: ${allTimeHigh} days`}
        trend={{ value: "Active", type: "positive" }}
      />
      
      <MetricCard
        title="Log Completion Rate"
        value={`${completionRate}%`}
        description="Average habit completion this week"
        trend={{ value: "Stable", type: "neutral" }}
      />
      
      <MetricCard
        title="Time Invested"
        value={`${hoursInvested.toFixed(1)}h`}
        description="Total hours on active targets"
        trend={{ value: "+2.4h", type: "positive" }}
      />

      <MetricCard
        title="Total Findings"
        value={findingsCount}
        description="Security bugs identified"
        trend={{ value: "New", type: "positive" }}
      />
    </div>
  );
}