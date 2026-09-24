"use client";

import * as React from "react";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { HistoricalAnalyticsPayload } from "@/lib/services/analytics/historicalAnalytics";

export default function AnalyticsPage() {
  const [data, setData] = React.useState<HistoricalAnalyticsPayload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"daily" | "weekly" | "monthly" | "yearly">("daily");

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed loading historical analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 font-mono text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
          <span>Compiling Historical Performance Analytics...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 font-mono text-xs text-zinc-400">
        <p>No historical analytics data available.</p>
        <Button variant="secondary" onClick={loadAnalytics} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 font-mono text-xs text-zinc-200">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle/80 pb-5">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white uppercase flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-cyan" /> Historical Performance Analytics
          </h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            // Canonical time-series performance analysis: Daily · Weekly · Monthly · Yearly.
          </p>
        </div>

        {/* PERSPECTIVE SELECTOR TABS */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-border-subtle">
          <button
            onClick={() => setActiveTab("daily")}
            className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors ${
              activeTab === "daily" ? "bg-accent-cyan text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setActiveTab("weekly")}
            className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors ${
              activeTab === "weekly" ? "bg-accent-cyan text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setActiveTab("monthly")}
            className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors ${
              activeTab === "monthly" ? "bg-accent-cyan text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setActiveTab("yearly")}
            className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors ${
              activeTab === "yearly" ? "bg-accent-cyan text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* ── DAILY VIEW ──────────────────────────────────────────────────────── */}
      {activeTab === "daily" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">
              Rolling past 14 days of productive hours against the 8.0h workday standard.
            </span>
            <span className="text-[10px] text-zinc-500 uppercase font-bold">
              Target: 8.0h / Weekday
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {data.daily.map((d) => (
              <div
                key={d.date}
                className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 ${
                  d.productiveHours >= 8.0
                    ? "bg-accent-cyan/10 border-accent-cyan/40"
                    : d.isWeekend
                    ? "bg-zinc-950/40 border-zinc-900"
                    : "bg-black/40 border-border-subtle"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-zinc-500">
                      {d.dayOfWeek.slice(0, 3)}
                    </span>
                    <span className="text-[9px] text-zinc-600">{d.date.slice(5)}</span>
                  </div>
                  <div className="text-lg font-bold text-cyan-400 mt-1 font-mono">
                    {d.productiveHours}h
                  </div>
                  <div className="text-[9px] text-zinc-500 font-mono">
                    Actual Work
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-900/80 flex items-center justify-between text-[9px]">
                  <span className="text-zinc-500">Tgt: {d.targetHours}h</span>
                  <span
                    className={`font-bold ${
                      d.variance >= 0 ? "text-success-emerald" : "text-danger-rose"
                    }`}
                  >
                    {d.variance >= 0 ? `+${d.variance}h` : `${d.variance}h`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border border-border-subtle bg-black/40 rounded-xl p-5 space-y-3">
            <h2 className="text-white font-bold uppercase tracking-wider text-xs">
              Daily Distribution Summary
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] uppercase text-zinc-500">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Day</th>
                    <th className="pb-2">Daily Target</th>
                    <th className="pb-2">Actual Work</th>
                    <th className="pb-2">Variance</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 font-mono">
                  {data.daily.map((d) => (
                    <tr key={d.date} className="hover:bg-zinc-950/50 transition-colors">
                      <td className="py-2 text-white font-bold">{d.date}</td>
                      <td className="py-2 text-zinc-400">{d.dayOfWeek}</td>
                      <td className="py-2 text-zinc-500">{d.targetHours}h</td>
                      <td className="py-2 text-accent-cyan font-bold">{d.productiveHours}h</td>
                      <td className="py-2">
                        <span
                          className={`font-bold ${
                            d.variance >= 0 ? "text-success-emerald" : "text-danger-rose"
                          }`}
                        >
                          {d.variance >= 0 ? `+${d.variance}h` : `${d.variance}h`}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        {d.metTarget ? (
                          <span className="text-success-emerald font-bold text-[10px]">
                            {d.isWeekend ? "Active Rest" : "Met Target ✅"}
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-[10px]">
                            {d.isWeekend ? "Holiday" : "Under Target"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── WEEKLY VIEW ─────────────────────────────────────────────────────── */}
      {activeTab === "weekly" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">
              Recent 8 weeks of workweek execution vs 40.0h standard.
            </span>
            <span className="text-[10px] text-zinc-500 uppercase font-bold">
              Standard: 40.0h / Week (5 Workdays × 8h)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {data.weekly.map((w) => (
              <div
                key={`${w.year}-${w.weekNumber}`}
                className="border border-border-subtle bg-black/40 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">
                    {w.year} · Week {w.weekNumber}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                      w.status === "GREEN"
                        ? "bg-success-emerald/10 border-success-emerald/30 text-success-emerald"
                        : w.status === "YELLOW"
                        ? "bg-warning-amber/10 border-warning-amber/30 text-warning-amber"
                        : "bg-danger-rose/10 border-danger-rose/30 text-danger-rose"
                    }`}
                  >
                    {w.status}
                  </span>
                </div>

                <div className="text-[10px] text-zinc-500">
                  {w.startDate} → {w.endDate}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900">
                  <div>
                    <span className="text-[9px] uppercase text-zinc-500 block">Actual / Target</span>
                    <span className="font-bold text-accent-cyan text-sm">{w.actualHours}h</span>
                    <span className="text-[9px] text-zinc-600 block">/ {w.weeklyTarget}h</span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase text-zinc-500 block">Workday Avg</span>
                    <span className="font-bold text-white text-sm">{w.workdayAverage}h</span>
                    <span className="text-[9px] text-zinc-600 block">Ideal: 8.0h</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px]">
                  <span className="text-zinc-500">
                    {w.recoveryRequired ? "Weekend Recovery" : "Clean Workweek"}
                  </span>
                  <span
                    className={`font-bold ${
                      w.variance >= 0 ? "text-success-emerald" : "text-danger-rose"
                    }`}
                  >
                    {w.variance >= 0 ? `+${w.variance}h` : `${w.variance}h`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MONTHLY VIEW ────────────────────────────────────────────────────── */}
      {activeTab === "monthly" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">
              Calendar month performance across {data.yearly[0]?.year || "the year"}.
            </span>
            <span className="text-[10px] text-zinc-500 uppercase font-bold">
              Target Formula: Workdays × 8.0h
            </span>
          </div>

          <div className="border border-border-subtle bg-black/40 rounded-xl p-5 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] uppercase text-zinc-500">
                    <th className="pb-2">Month</th>
                    <th className="pb-2">Workdays</th>
                    <th className="pb-2">Target</th>
                    <th className="pb-2">Actual Work</th>
                    <th className="pb-2">Workday Avg</th>
                    <th className="pb-2">Completion %</th>
                    <th className="pb-2">Surplus / Deficit</th>
                    <th className="pb-2">Trend</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 font-mono">
                  {data.monthly.map((m) => (
                    <tr key={m.month} className="hover:bg-zinc-950/50 transition-colors">
                      <td className="py-2.5 font-bold text-white">{m.monthName}</td>
                      <td className="py-2.5 text-zinc-400">{m.workdayCount}</td>
                      <td className="py-2.5 text-zinc-400">{m.monthlyTarget}h</td>
                      <td className="py-2.5 font-bold text-accent-cyan">{m.actualHours}h</td>
                      <td className="py-2.5 text-white">{m.workdayAverage}h/day</td>
                      <td className="py-2.5">
                        <span
                          className={`font-bold ${
                            m.completionPercentage >= 100
                              ? "text-success-emerald"
                              : m.completionPercentage >= 75
                              ? "text-warning-amber"
                              : "text-danger-rose"
                          }`}
                        >
                          {m.completionPercentage}%
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`font-bold ${
                            m.variance >= 0 ? "text-success-emerald" : "text-danger-rose"
                          }`}
                        >
                          {m.variance >= 0 ? `+${m.variance}h` : `${m.variance}h`}
                        </span>
                      </td>
                      <td className="py-2.5 text-zinc-400 text-[10px] uppercase">{m.trend}</td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                            m.status === "GREEN"
                              ? "bg-success-emerald/10 border-success-emerald/30 text-success-emerald"
                              : m.status === "YELLOW"
                              ? "bg-warning-amber/10 border-warning-amber/30 text-warning-amber"
                              : "bg-danger-rose/10 border-danger-rose/30 text-danger-rose"
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── YEARLY VIEW ─────────────────────────────────────────────────────── */}
      {activeTab === "yearly" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">
              Long-term annual totals and target achievement.
            </span>
          </div>

          {data.yearly.map((y) => (
            <div key={y.year} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-black/40 border border-border-subtle rounded-xl p-4">
                  <span className="text-[10px] text-zinc-500 uppercase block font-bold">
                    Yearly Target
                  </span>
                  <div className="text-2xl font-bold text-white">{y.yearlyTargetHours}h</div>
                  <span className="text-[10px] text-zinc-500">{y.totalWorkdays} Workdays × 8h</span>
                </div>

                <div className="bg-black/40 border border-border-subtle rounded-xl p-4">
                  <span className="text-[10px] text-zinc-500 uppercase block font-bold">
                    Actual Productive
                  </span>
                  <div className="text-2xl font-bold text-accent-cyan">
                    {y.yearlyProductiveHours}h
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    {y.learningHours}h L + {y.huntingHours}h H
                  </span>
                </div>

                <div className="bg-black/40 border border-border-subtle rounded-xl p-4">
                  <span className="text-[10px] text-zinc-500 uppercase block font-bold">
                    Achievement Rate
                  </span>
                  <div className="text-2xl font-bold text-white">{y.targetAchievement}%</div>
                  <span
                    className={`text-[10px] font-bold ${
                      y.variance >= 0 ? "text-success-emerald" : "text-danger-rose"
                    }`}
                  >
                    {y.variance >= 0 ? `+${y.variance}h Surplus` : `${y.variance}h Deficit`}
                  </span>
                </div>

                <div className="bg-black/40 border border-border-subtle rounded-xl p-4">
                  <span className="text-[10px] text-zinc-500 uppercase block font-bold">
                    Annual Workday Avg
                  </span>
                  <div className="text-2xl font-bold text-white">{y.averageWorkdayHours}h/day</div>
                  <span className="text-[10px] text-zinc-500">Ideal: 8.0h/day</span>
                </div>
              </div>

              {/* MONTH-BY-MONTH PROGRESSION */}
              <div className="border border-border-subtle bg-black/40 rounded-xl p-5 space-y-3">
                <h2 className="text-white font-bold uppercase tracking-wider text-xs">
                  Year {y.year} Monthly Trajectory
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 text-center">
                  {y.monthlyTrend.map((m) => (
                    <div
                      key={m.month}
                      className="p-2.5 rounded-lg border border-zinc-900 bg-zinc-950/50 space-y-1"
                    >
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                        {m.monthName}
                      </span>
                      <span className="text-sm font-bold text-white block">{m.hours}h</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}