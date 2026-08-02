"use client";

import * as React from "react";
import { 
  Activity, Clock, Layers, Target, BookOpen, AlertCircle, 
  Award, TrendingUp, Calendar, ChevronUp, ChevronDown, CheckCircle2, Moon, AwardIcon
} from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";

type TargetRow = {
  targetId: string;
  name: string;
  huntingHours: number;
  reportsSubmitted: number;
  validReports: number;
  hoursPerValidReport: number | null;
};

type TopicRow = {
  topicId: string;
  name: string;
  totalHours: number;
  sessionsCount: number;
  lastStudiedAt: string | null;
};

type HabitPoint = {
  date: string;
  reading: number;
  workout: number;
  sleepHours: number;
  bedTimeMinutes: number;
  wakeTimeMinutes: number;
  consistency: number;
  completionPercent: number;
};

type AnalyticsData = {
  overview: {
    totalHuntingHours: number;
    totalLearningHours: number;
    totalSessions: number;
    totalTargets: number;
    totalLearningTopics: number;
    reportsSubmitted: number;
    validReports: number;
    overallConsistency: number;
  };
  timeAllocation: {
    daily: { date: string; hunting: number; learning: number }[];
    weekly: { date: string; hunting: number; learning: number }[];
    monthly: { date: string; hunting: number; learning: number }[];
    yearly: { date: string; hunting: number; learning: number }[];
  };
  targetInvestment: TargetRow[];
  learningInvestment: {
    all: TopicRow[];
    mostStudied: TopicRow[];
    leastStudied: TopicRow[];
    recentlyLearned: TopicRow[];
  };
  habitAnalytics: HabitPoint[];
};

export default function AnalyticsPage() {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  // Section B state: daily / weekly / monthly / yearly
  const [allocationRange, setAllocationRange] = React.useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  
  // Section C state: sorting targets
  const [targetSortField, setTargetSortField] = React.useState<keyof TargetRow>("huntingHours");
  const [targetSortOrder, setTargetSortOrder] = React.useState<"asc" | "desc">("desc");

  // Section E state: active habit filter for chart
  const [activeHabit, setActiveHabit] = React.useState<"sleepHours" | "consistency" | "completionPercent" | "bedTimeMinutes" | "wakeTimeMinutes">("consistency");

  const syncData = async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed syncing analytics diagnostics:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    syncData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
        // INDEXING_PERFORMANCE_ANALYTICS_telemetry...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState 
          title="Performance Telemetry Offline" 
          description="Failed to compile intelligence matrices. Please ensure databases are initialized and active."
        />
      </div>
    );
  }

  const { overview, timeAllocation, targetInvestment, learningInvestment, habitAnalytics } = data;

  // Sorting logic for targets
  const sortedTargets = [...targetInvestment].sort((a, b) => {
    const aVal = a[targetSortField];
    const bVal = b[targetSortField];
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    if (aVal < bVal) return targetSortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return targetSortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const toggleTargetSort = (field: keyof TargetRow) => {
    if (targetSortField === field) {
      setTargetSortOrder(targetSortOrder === "asc" ? "desc" : "asc");
    } else {
      setTargetSortField(field);
      setTargetSortOrder("desc");
    }
  };

  // Helper to format minutes as HH:MM
  const formatMinutesToTime = (mins: number) => {
    if (!mins) return "00:00";
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // Sections data prep for charts
  const allocationPoints = timeAllocation[allocationRange] || [];
  const huntingChartData = allocationPoints.map(p => ({ label: p.date, value: Math.round(p.hunting * 10) / 10 }));
  const learningChartData = allocationPoints.map(p => ({ label: p.date, value: Math.round(p.learning * 10) / 10 }));

  // Habit analytics chart mapping
  const habitChartData = habitAnalytics.map(h => {
    let val = h[activeHabit];
    if (activeHabit === "bedTimeMinutes" || activeHabit === "wakeTimeMinutes") {
      // Map minutes from midnight directly
      val = Math.round((val / 60) * 10) / 10; // represent in fractional hours
    }
    return {
      label: h.date.slice(5), // MM-DD
      value: val,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 text-zinc-200">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white uppercase font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-cyan animate-pulse" /> Security Yield & Time Analytics
          </h1>
          <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">// WHAT HAPPENED? - Comprehensive visual diagnostic records.</p>
        </div>
      </div>

      {/* 2. SECTION A: Overview KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 font-mono text-xs">
        <div className="border border-border-subtle bg-black p-3.5 rounded-lg">
          <span className="block text-[8px] text-zinc-500 uppercase">Hunting Hours</span>
          <span className="block text-md font-bold text-accent-cyan mt-1">{overview.totalHuntingHours.toFixed(1)}h</span>
        </div>
        <div className="border border-border-subtle bg-black p-3.5 rounded-lg">
          <span className="block text-[8px] text-zinc-500 uppercase">Learning Hours</span>
          <span className="block text-md font-bold text-success-emerald mt-1">{overview.totalLearningHours.toFixed(1)}h</span>
        </div>
        <div className="border border-border-subtle bg-black p-3.5 rounded-lg">
          <span className="block text-[8px] text-zinc-500 uppercase">Total Sessions</span>
          <span className="block text-md font-bold text-white mt-1">{overview.totalSessions}</span>
        </div>
        <div className="border border-border-subtle bg-black p-3.5 rounded-lg">
          <span className="block text-[8px] text-zinc-500 uppercase">Targets Tracked</span>
          <span className="block text-md font-bold text-white mt-1">{overview.totalTargets}</span>
        </div>
        <div className="border border-border-subtle bg-black p-3.5 rounded-lg">
          <span className="block text-[8px] text-zinc-500 uppercase">Study Topics</span>
          <span className="block text-md font-bold text-white mt-1">{overview.totalLearningTopics}</span>
        </div>
        <div className="border border-border-subtle bg-black p-3.5 rounded-lg">
          <span className="block text-[8px] text-zinc-500 uppercase">Reports Submitted</span>
          <span className="block text-md font-bold text-warning-amber mt-1">{overview.reportsSubmitted}</span>
        </div>
        <div className="border border-border-subtle bg-black p-3.5 rounded-lg">
          <span className="block text-[8px] text-zinc-500 uppercase">Valid Reports</span>
          <span className="block text-md font-bold text-success-emerald mt-1">{overview.validReports}</span>
        </div>
        <div className="border border-border-subtle bg-black p-3.5 rounded-lg">
          <span className="block text-[8px] text-zinc-500 uppercase">Consistency</span>
          <span className="block text-md font-bold text-white mt-1">{overview.overallConsistency}%</span>
        </div>
      </div>

      {/* 3. SECTION B: Time Allocation (Hunting vs Learning) */}
      <Panel>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4 mb-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Clock size={13} className="text-accent-cyan" /> Time Allocation & Burn Velocity
          </h3>
          <div className="flex bg-black border border-border-subtle p-0.5 rounded font-mono text-[9px]">
            {(["daily", "weekly", "monthly", "yearly"] as const).map(range => (
              <button
                key={range}
                onClick={() => setAllocationRange(range)}
                className={`px-2 py-1 uppercase font-bold transition-all rounded-sm cursor-pointer ${allocationRange === range ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span className="uppercase font-bold text-accent-cyan flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan" /> Hunting Hours Trend
              </span>
              <span>Avg: {(overview.totalHuntingHours / (allocationRange === "daily" ? 30 : 12)).toFixed(1)}h / interval</span>
            </div>
            {huntingChartData.length > 1 ? (
              <LineChart data={huntingChartData} height={160} />
            ) : (
              <div className="h-40 border border-border-subtle/50 bg-black rounded-lg flex items-center justify-center font-mono text-[10px] text-zinc-600">// INSUFFICIENT_TIMELINE_SERIES</div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span className="uppercase font-bold text-success-emerald flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success-emerald" /> Learning Hours Trend
              </span>
              <span>Avg: {(overview.totalLearningHours / (allocationRange === "daily" ? 30 : 12)).toFixed(1)}h / interval</span>
            </div>
            {learningChartData.length > 1 ? (
              <LineChart data={learningChartData} height={160} />
            ) : (
              <div className="h-40 border border-border-subtle/50 bg-black rounded-lg flex items-center justify-center font-mono text-[10px] text-zinc-600">// INSUFFICIENT_TIMELINE_SERIES</div>
            )}
          </div>
        </div>
      </Panel>

      {/* 4. SECTION C: Target Investment Ranking */}
      <Panel>
        <div className="border-b border-border-subtle pb-4 mb-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Target size={13} className="text-accent-cyan" /> Target Investment Performance Matrix
          </h3>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Yield metrics aggregated by target container. Click headers to sort.</p>
        </div>

        {targetInvestment.length === 0 ? (
          <EmptyState title="No Active Targets" description="Create targets and log sessions to compute investment indexes." />
        ) : (
          <div className="border border-border-subtle rounded-lg overflow-hidden bg-black font-mono text-[11px] overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-zinc-950 border-b border-border-subtle text-zinc-500 text-[9px] uppercase">
                <tr>
                  <th className="py-3 px-4 text-zinc-400 font-bold">Target</th>
                  <th className="py-3 px-4 text-right cursor-pointer hover:bg-zinc-900" onClick={() => toggleTargetSort("huntingHours")}>
                    <div className="flex items-center justify-end gap-1">
                      Hunting Hours {targetSortField === "huntingHours" && (targetSortOrder === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right cursor-pointer hover:bg-zinc-900" onClick={() => toggleTargetSort("reportsSubmitted")}>
                    <div className="flex items-center justify-end gap-1">
                      Reports {targetSortField === "reportsSubmitted" && (targetSortOrder === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right cursor-pointer hover:bg-zinc-900" onClick={() => toggleTargetSort("validReports")}>
                    <div className="flex items-center justify-end gap-1">
                      Valid Reports {targetSortField === "validReports" && (targetSortOrder === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right cursor-pointer hover:bg-zinc-900" onClick={() => toggleTargetSort("hoursPerValidReport")}>
                    <div className="flex items-center justify-end gap-1">
                      Hours / Valid Report {targetSortField === "hoursPerValidReport" && (targetSortOrder === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50 text-zinc-300">
                {sortedTargets.map((row) => (
                  <tr key={row.targetId} className="hover:bg-zinc-950/60 transition-colors">
                    <td className="py-3 px-4 font-bold uppercase text-white">{row.name}</td>
                    <td className="py-3 px-4 text-right">{row.huntingHours.toFixed(1)}h</td>
                    <td className="py-3 px-4 text-right text-warning-amber">{row.reportsSubmitted}</td>
                    <td className="py-3 px-4 text-right text-success-emerald font-bold">{row.validReports}</td>
                    <td className="py-3 px-4 text-right text-accent-cyan font-bold">
                      {row.hoursPerValidReport !== null ? `${row.hoursPerValidReport.toFixed(1)}h` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* 5. SECTION D: Learning Investment ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Studied */}
        <Panel>
          <div className="border-b border-border-subtle pb-3 mb-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Award size={13} className="text-success-emerald" /> Most Studied Topics
            </h4>
          </div>
          {learningInvestment.mostStudied.length === 0 ? (
            <p className="text-[10px] font-mono text-zinc-600 leading-relaxed">// NO_TOPICS_STUDIED_YET</p>
          ) : (
            <div className="space-y-2.5 font-mono text-[11px]">
              {learningInvestment.mostStudied.slice(0, 5).map((tp, idx) => (
                <div key={tp.topicId} className="flex justify-between items-center bg-black/40 border border-border-subtle/40 p-2.5 rounded hover:border-success-emerald/20 transition-all">
                  <span className="truncate uppercase max-w-[160px] text-zinc-200 font-bold">{idx + 1}. {tp.name}</span>
                  <span className="text-success-emerald font-bold">{tp.totalHours.toFixed(1)}h <span className="text-zinc-600 font-normal">({tp.sessionsCount} sessions)</span></span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Least Studied */}
        <Panel>
          <div className="border-b border-border-subtle pb-3 mb-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <BookOpen size={13} className="text-warning-amber" /> Least Studied Topics
            </h4>
          </div>
          {learningInvestment.leastStudied.length === 0 ? (
            <p className="text-[10px] font-mono text-zinc-600 leading-relaxed">// NO_TOPICS_STUDIED_YET</p>
          ) : (
            <div className="space-y-2.5 font-mono text-[11px]">
              {learningInvestment.leastStudied.slice(0, 5).map((tp, idx) => (
                <div key={tp.topicId} className="flex justify-between items-center bg-black/40 border border-border-subtle/40 p-2.5 rounded hover:border-warning-amber/20 transition-all">
                  <span className="truncate uppercase max-w-[160px] text-zinc-200 font-bold">{idx + 1}. {tp.name}</span>
                  <span className="text-zinc-400">{tp.totalHours.toFixed(1)}h <span className="text-zinc-600 font-normal">({tp.sessionsCount} sessions)</span></span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Recently Studied */}
        <Panel>
          <div className="border-b border-border-subtle pb-3 mb-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Calendar size={13} className="text-accent-cyan" /> Recently Learned Topics
            </h4>
          </div>
          {learningInvestment.recentlyLearned.length === 0 ? (
            <p className="text-[10px] font-mono text-zinc-600 leading-relaxed">// NO_TOPICS_STUDIED_YET</p>
          ) : (
            <div className="space-y-2.5 font-mono text-[11px]">
              {learningInvestment.recentlyLearned.slice(0, 5).map((tp, idx) => (
                <div key={tp.topicId} className="flex justify-between items-center bg-black/40 border border-border-subtle/40 p-2.5 rounded hover:border-accent-cyan/20 transition-all">
                  <span className="truncate uppercase max-w-[160px] text-zinc-200 font-bold">{tp.name}</span>
                  <span className="text-zinc-400 text-[10px]">
                    {tp.lastStudiedAt ? new Date(tp.lastStudiedAt).toLocaleDateString([], { dateStyle: "short" }) : "Never"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* 6. SECTION E: Habit Analytics */}
      <Panel>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4 mb-4">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-success-emerald" /> Core Habit Analytics & Compliance Trend
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">30-day timeline plotting selected habit metrics.</p>
          </div>
          <div className="flex flex-wrap bg-black border border-border-subtle p-0.5 rounded font-mono text-[9px] gap-0.5">
            {[
              { id: "consistency", label: "Consistency" },
              { id: "completionPercent", label: "Completion %" },
              { id: "sleepHours", label: "Sleep" },
              { id: "bedTimeMinutes", label: "Bed Time" },
              { id: "wakeTimeMinutes", label: "Wake Time" }
            ].map(habit => (
              <button
                key={habit.id}
                onClick={() => setActiveHabit(habit.id as any)}
                className={`px-2 py-1 uppercase font-bold transition-all rounded-sm cursor-pointer ${activeHabit === habit.id ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                {habit.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {habitChartData.length > 1 ? (
            <LineChart data={habitChartData} height={180} />
          ) : (
            <div className="h-44 border border-border-subtle/50 bg-black rounded-lg flex items-center justify-center font-mono text-[10px] text-zinc-600">// INDEXING_DAILY_HABIT_SERIES</div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-mono text-[11px] pt-2 border-t border-border-subtle/50">
            <div>
              <span className="text-zinc-500 block text-[9px] uppercase">Mean Sleep Hours</span>
              <span className="text-white font-bold text-xs mt-1 block">
                {(habitAnalytics.reduce((acc, h) => acc + h.sleepHours, 0) / habitAnalytics.length).toFixed(1)}h
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[9px] uppercase">Mean Bed Time</span>
              <span className="text-white font-bold text-xs mt-1 block">
                {formatMinutesToTime(habitAnalytics.reduce((acc, h) => acc + h.bedTimeMinutes, 0) / habitAnalytics.length)}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[9px] uppercase">Mean Wake Time</span>
              <span className="text-white font-bold text-xs mt-1 block">
                {formatMinutesToTime(habitAnalytics.reduce((acc, h) => acc + h.wakeTimeMinutes, 0) / habitAnalytics.length)}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[9px] uppercase">Habit Completion</span>
              <span className="text-success-emerald font-bold text-xs mt-1 block">
                {Math.round(habitAnalytics.reduce((acc, h) => acc + h.completionPercent, 0) / habitAnalytics.length)}%
              </span>
            </div>
          </div>
        </div>
      </Panel>

    </div>
  );
}