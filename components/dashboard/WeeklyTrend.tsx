"use client";

import * as React from "react";
import { Panel } from "@/components/ui/Panel";
import { MiniSparkline } from "@/components/ui/MiniSparkleline";

type WeeklyTrendProps = {
  activityData?: number[];
  currentWeekAvg?: number;
  previousWeekAvg?: number;
};

export default function WeeklyTrend({ 
  activityData = [], 
  currentWeekAvg = 0, 
  previousWeekAvg = 0 
}: WeeklyTrendProps) {
  
  const isPerformanceUp = currentWeekAvg >= previousWeekAvg;
  const percentageChange = previousWeekAvg === 0 
    ? 100 
    : Math.round(((currentWeekAvg - previousWeekAvg) / previousWeekAvg) * 100);

  return (
    <Panel>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left Hand Metric Wording Block */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
            Weekly Activity Velocity
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Operational momentum compared to the previous trailing 7 days.
          </p>
          
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-white font-sans">
              {currentWeekAvg.toFixed(1)}h/day
            </span>
            <span className={`text-[10px] font-mono font-medium ${isPerformanceUp ? "text-success-emerald" : "text-danger-rose"}`}>
              {isPerformanceUp ? "▲" : "▼"} {Math.abs(percentageChange)}%
            </span>
          </div>
        </div>

        {/* Right Hand Minimal Chart Sparkline Block */}
        <div className="flex items-center justify-center p-2 bg-black border border-border-subtle rounded-lg min-w-[140px] h-[50px]">
          <MiniSparkline 
            data={activityData} 
            width={140} 
            height={34} 
            variant={isPerformanceUp ? "success" : "danger"} 
          />
        </div>
      </div>
    </Panel>
  );
}