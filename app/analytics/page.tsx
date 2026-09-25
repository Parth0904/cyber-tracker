"use client";

import * as React from "react";
import {
  Activity,
  Calendar,
  Clock,
  Shield,
  TrendingUp,
  Award,
  Zap,
  CheckCircle2,
  RefreshCw,
  BarChart3,
  CalendarDays,
} from "lucide-react";
import type {
  GlobalAnalyticsResult,
  MonthPerformanceSummary,
} from "@/lib/services/analytics/globalAnalytics";

export default function GlobalAnalyticsPage() {
  const [range, setRange] = React.useState<"all" | "this_year" | "prev_year">("all");
  const [data, setData] = React.useState<GlobalAnalyticsResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchAnalytics = React.useCallback(async (r: string, isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch(`/api/analytics?range=${r}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.analytics) {
          setData(json.analytics);
        }
      }
    } catch (err) {
      console.error("Failed loading global analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAnalytics(range);
  }, [range, fetchAnalytics]);

  const maxMonthHours = React.useMemo(() => {
    if (!data || data.monthlyTrends.length === 0) return 200;
    const max = Math.max(...data.monthlyTrends.map((m) => Math.max(m.actualHours, m.plannedHours)));
    return Math.max(max, 100);
  }, [data]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 text-zinc-100 font-sans">
      
      {/* 1. TOP HEADER & FILTER RUNWAY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2 font-mono">
              <Activity className="w-4 h-4 text-cyan-400" />
              GLOBAL WORK TIME ANALYTICS
            </h1>
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            // Complete verified Work Time history from Windows Agent & Calendar plan.
          </p>
        </div>

        {/* TIME RANGE FILTER BUTTONS */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 font-mono text-xs">
            <button
              onClick={() => setRange("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                range === "all"
                  ? "bg-cyan-500 text-black font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setRange("this_year")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                range === "this_year"
                  ? "bg-cyan-500 text-black font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              This Year
            </button>
            <button
              onClick={() => setRange("prev_year")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                range === "prev_year"
                  ? "bg-cyan-500 text-black font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Previous Year
            </button>
          </div>

          <button
            onClick={() => fetchAnalytics(range, true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh analytics"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin text-cyan-400" : ""} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center p-16 text-zinc-500 font-mono text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>AGGREGATING_CANONICAL_WORK_TIME_DATA...</span>
          </div>
        </div>
      ) : !data || data.trackedDaysCount === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-12 text-center space-y-3 font-mono">
          <Shield size={32} className="mx-auto text-zinc-600" />
          <h2 className="text-base font-bold text-white">No Work Time Recorded Yet</h2>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Once the Windows Work Time Agent records active usage, your global analytics,
            historical trends, and plan completion will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* 2. CORE GLOBAL METRICS ROW (Primary 4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Work */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-5 space-y-2 relative overflow-hidden backdrop-blur-xl">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-cyan-400 font-medium">
                <span>Total Work</span>
                <Shield size={14} className="text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                  {data.totalWorkFormatted}
                </span>
              </div>
              <div className="text-[11px] text-zinc-500 font-mono flex items-center justify-between pt-1 border-t border-zinc-900">
                <span>{data.totalWorkHours.toFixed(1)} verified hours</span>
                <span className="text-zinc-400">{data.rangeLabel}</span>
              </div>
            </div>

            {/* Average Per Day */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-5 space-y-2 backdrop-blur-xl">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-medium flex items-center justify-between">
                <span>Avg / Day</span>
                <Clock size={14} className="text-zinc-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-cyan-400 tracking-tight">
                {data.averagePerTrackedDayFormatted}
              </div>
              <div className="text-[11px] text-zinc-500 font-mono flex items-center justify-between pt-1 border-t border-zinc-900">
                <span>Across {data.trackedDaysCount} tracked days</span>
                <span>{data.averagePerTrackedDayHours.toFixed(2)}h/day</span>
              </div>
            </div>

            {/* Average Workday */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-5 space-y-2 backdrop-blur-xl">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-medium flex items-center justify-between">
                <span>Avg / Workday</span>
                <Calendar size={14} className="text-zinc-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                {data.averagePerWorkdayFormatted}
              </div>
              <div className="text-[11px] text-zinc-500 font-mono flex items-center justify-between pt-1 border-t border-zinc-900">
                <span>Per planned workday</span>
                <span>{data.plannedWorkdaysCount} workdays</span>
              </div>
            </div>

            {/* Active Days */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-5 space-y-2 backdrop-blur-xl">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-medium flex items-center justify-between">
                <span>Active Days</span>
                <CheckCircle2 size={14} className="text-emerald-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 tracking-tight">
                {data.activeDaysCount}
              </div>
              <div className="text-[11px] text-zinc-500 font-mono flex items-center justify-between pt-1 border-t border-zinc-900">
                <span>Days with work &gt; 0h</span>
                <span>{data.trackedDaysCount} recorded</span>
              </div>
            </div>

          </div>

          {/* 3. SECONDARY CONTEXT METRICS (Highest, Lowest, Plan Completion, Streak) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Highest Day */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Award size={12} /> Highest Day
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {data.highestDay ? data.highestDay.formattedDuration : "—"}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                {data.highestDay ? data.highestDay.formattedDate : "No activity"}
              </div>
            </div>

            {/* Lowest Active Day */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Clock size={12} /> Lowest Active Day
              </div>
              <div className="text-xl font-bold font-mono text-zinc-300">
                {data.lowestActiveDay ? data.lowestActiveDay.formattedDuration : "—"}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                {data.lowestActiveDay ? data.lowestActiveDay.formattedDate : "No activity"}
              </div>
            </div>

            {/* Plan Completion % */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <TrendingUp size={12} /> Plan Completion
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {data.planCompletionPercentage.toFixed(1)}%
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                {data.totalPlannedHours}h planned standard
              </div>
            </div>

            {/* Tracking Streak */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Zap size={12} /> Active Streak
              </div>
              <div className="text-xl font-bold font-mono text-cyan-300">
                {data.currentStreakDays} {data.currentStreakDays === 1 ? "day" : "days"}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                Consecutive days active
              </div>
            </div>

          </div>

          {/* 4. HISTORICAL MONTHLY TREND (Visual Chart & Values) */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-6 space-y-6 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                  <BarChart3 size={15} className="text-cyan-400" />
                  Monthly Work Time Trend
                </h2>
                <p className="text-xs text-zinc-500 font-mono">
                  Actual verified Work Time per calendar month from Windows Agent.
                </p>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                {data.monthlyTrends.length} {data.monthlyTrends.length === 1 ? "Month" : "Months"}
              </span>
            </div>

            {/* Visual Bars Runway */}
            <div className="space-y-4">
              {/* Chronological list for chart */}
              {[...data.monthlyTrends].reverse().map((m) => {
                const actualWidthPercent = Math.min(100, Math.max(3, (m.actualHours / maxMonthHours) * 100));
                const plannedWidthPercent = Math.min(100, Math.max(3, (m.plannedHours / maxMonthHours) * 100));
                const metPlan = m.actualHours >= m.plannedHours;

                return (
                  <div key={m.month} className="space-y-1.5">
                    <div className="flex items-baseline justify-between text-xs font-mono">
                      <span className="font-bold text-white tracking-wide">
                        {m.monthName}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500 text-[11px]">
                          Planned: {m.plannedHours}h
                        </span>
                        <span className={`font-bold ${metPlan ? "text-emerald-400" : "text-cyan-400"}`}>
                          {m.actualFormatted}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-semibold w-12 text-right">
                          {m.completionPercentage}%
                        </span>
                      </div>
                    </div>

                    {/* Comparative Dual Bar */}
                    <div className="w-full bg-zinc-900 rounded-full h-3.5 overflow-hidden border border-zinc-800/80 p-0.5 relative">
                      {/* Actual Work Bar */}
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          metPlan
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            : "bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                        }`}
                        style={{ width: `${actualWidthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. PLANNED VS ACTUAL HISTORICAL PERFORMANCE TABLE */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                  <CalendarDays size={15} className="text-cyan-400" />
                  Monthly Performance Breakdown
                </h2>
                <p className="text-xs text-zinc-500 font-mono">
                  Comparative analysis of planned schedule vs authoritative actual work.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs divide-y divide-zinc-900">
                <thead className="bg-zinc-900/60 text-[11px] uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Month</th>
                    <th className="py-3 px-4 font-semibold text-center">Planned Workdays</th>
                    <th className="py-3 px-4 font-semibold text-right">Planned Hours</th>
                    <th className="py-3 px-4 font-semibold text-right text-cyan-300">Actual Work</th>
                    <th className="py-3 px-4 font-semibold text-center">Plan %</th>
                    <th className="py-3 px-4 font-semibold text-center">Active Days</th>
                    <th className="py-3 px-4 font-semibold text-right">Avg / Active Day</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/80">
                  {data.monthlyTrends.map((m) => {
                    const met = m.actualHours >= m.plannedHours;
                    return (
                      <tr key={m.month} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                          {m.monthName}
                        </td>
                        <td className="py-3.5 px-4 text-center text-zinc-300">
                          {m.plannedWorkdays}
                        </td>
                        <td className="py-3.5 px-4 text-right text-zinc-400">
                          {m.plannedHours}h
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-cyan-400 whitespace-nowrap">
                          {m.actualFormatted}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              met
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                                : "bg-cyan-950/60 text-cyan-300 border border-cyan-800/40"
                            }`}
                          >
                            {m.completionPercentage}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-zinc-300">
                          {m.activeDays}
                        </td>
                        <td className="py-3.5 px-4 text-right text-zinc-300">
                          {m.averagePerActiveDayFormatted}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

          {/* 6. COMPACT LIFETIME SUMMARY (Section 6 Standard) */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-6 space-y-4 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                {data.rangeLabel.toUpperCase()} SUMMARY
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                Authoritative Windows Agent Projection
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 font-mono text-xs">
              <div className="space-y-0.5">
                <span className="text-zinc-500 text-[10px] uppercase block">Total Work</span>
                <span className="text-base font-bold text-white">{data.totalWorkFormatted}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-zinc-500 text-[10px] uppercase block">Average / Day</span>
                <span className="text-base font-bold text-cyan-300">{data.averagePerTrackedDayFormatted}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-zinc-500 text-[10px] uppercase block">Avg / Workday</span>
                <span className="text-base font-bold text-white">{data.averagePerWorkdayFormatted}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-zinc-500 text-[10px] uppercase block">Active Days</span>
                <span className="text-base font-bold text-emerald-400">{data.activeDaysCount}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-zinc-500 text-[10px] uppercase block">Planned Workdays</span>
                <span className="text-base font-bold text-zinc-300">{data.plannedWorkdaysCount}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-zinc-500 text-[10px] uppercase block">Plan Completion</span>
                <span className="text-base font-bold text-cyan-400">{data.planCompletionPercentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}