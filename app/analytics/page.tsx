"use client";

import * as React from "react";
import { 
  Activity, Clock, Target, BookOpen, 
  Award, Calendar, ChevronUp, ChevronDown, CheckCircle2,
  Shield, Zap, CheckSquare, TrendingUp, Flame, Info, AwardIcon
} from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import LineChart from "@/components/charts/LineChart";

type TargetRank = {
  targetId: string;
  name: string;
  sessions: number;
  reports: number;
  acceptedReports: number;
  productivityScore: number;
  efficiency: number;
};

type TopicRank = {
  topicId: string;
  name: string;
  learningBlocks: number;
  recentActivityDays: number | null;
  studyFrequencyWeeks: number;
};

type HabitTrendPoint = {
  label: string;
  averageSleep: number;
  readingCompliance: number;
  workoutFrequency: number;
  recoveryConsistency: number;
  productivityTrend: number;
  weeklyConsistencyTrend: number;
};

type RecordPoint = {
  name: string;
  value: string | number;
  dateOrInterval?: string;
};

type MilestonePoint = {
  name: string;
  unlocked: boolean;
  dateUnlocked: string | null;
};

type ProgressComparisonPoint = {
  metric: string;
  currentPeriod: string | number;
  previousPeriod: string | number;
  change: string;
};

type RedesignedAnalyticsData = {
  overview: {
    totalProductivityScore: number;
    totalLearningBlocks: number;
    totalBugReportStudyBlocks: number;
    totalReconSessions: number;
    totalTargetsTested: number;
    totalFindings: number;
    activeTargets: number;
    activeLearningTopics: number;
  };
  allocation: {
    daily: any[];
    weekly: any[];
    monthly: any[];
    yearly: any[];
  };
  targetInvestment: TargetRank[];
  learningInvestment: TopicRank[];
  habitTrends: HabitTrendPoint[];
  personalRecords: RecordPoint[];
  growthTimeline: MilestonePoint[];
  periodComparisons: ProgressComparisonPoint[];
};

export default function AnalyticsPage() {
  const [data, setData] = React.useState<RedesignedAnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Time & Effort Allocation Controls
  const [allocationRange, setAllocationRange] = React.useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [allocationMetric, setAllocationMetric] = React.useState<"learningBlocks" | "bugReportStudyBlocks" | "reconSessions" | "targetsTested" | "findings">("learningBlocks");

  // Sorting Targets state
  const [targetSortField, setTargetSortField] = React.useState<keyof TargetRank>("efficiency");
  const [targetSortOrder, setTargetSortOrder] = React.useState<"asc" | "desc">("desc");

  // Long-Term Habits Trends controls
  const [activeHabitTrend, setActiveHabitTrend] = React.useState<"averageSleep" | "readingCompliance" | "workoutFrequency" | "recoveryConsistency" | "productivityTrend">("recoveryConsistency");

  const syncAnalyticsData = async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to sync analytics performance dataset:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    syncAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
        // INDEXING_PERFORMANCE_DIAGNOSTICS_telemetry...
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

  const { overview, allocation, targetInvestment, learningInvestment, habitTrends, personalRecords, growthTimeline, periodComparisons } = data;

  const hasAnyData = 
    overview.totalProductivityScore > 0 || 
    overview.totalLearningBlocks > 0 || 
    overview.totalFindings > 0 || 
    overview.totalTargetsTested > 0 ||
    habitTrends.some(h => h.averageSleep > 0 || h.recoveryConsistency > 0);

  if (!hasAnyData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState 
          title="No Analytics Data Yet" 
          description="Your long-term performance telemetry will compile automatically once you start logging daily entries, targets, and study sessions."
        />
      </div>
    );
  }

  // Sorting Target ranks logic
  const sortedTargets = [...targetInvestment].sort((a, b) => {
    const aVal = a[targetSortField];
    const bVal = b[targetSortField];
    if (aVal < bVal) return targetSortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return targetSortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const toggleTargetSort = (field: keyof TargetRank) => {
    if (targetSortField === field) {
      setTargetSortOrder(targetSortOrder === "asc" ? "desc" : "asc");
    } else {
      setTargetSortField(field);
      setTargetSortOrder("desc");
    }
  };

  // Format allocation charts data
  const allocationPoints = allocation[allocationRange] || [];
  const allocationChartData = allocationPoints.map(p => ({
    label: p.label,
    value: p[allocationMetric] || 0
  }));

  // Format habits trend line charts data
  const habitTrendChartData = habitTrends.map(h => ({
    label: h.label,
    value: h[activeHabitTrend] || 0
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 text-zinc-200">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white uppercase font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-cyan animate-pulse" /> Long-Term Performance Metrics
          </h1>
          <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
            // ANALYTICS - Evaluating long-term growth, target efficiency, and effort trends.
          </p>
        </div>
      </div>

      {/* 2. Overview Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 font-mono text-xs">
        <div className="border border-border-subtle bg-black p-3.5 rounded-lg">
          <span className="block text-[8px] text-zinc-500 uppercase">Productivity Score</span>
          <span className="block text-md font-bold text-accent-cyan mt-1">{overview.totalProductivityScore}</span>
        </div>
        <div className="border border-border-subtle bg-black p-3.5 rounded-lg">
          <span className="block text-[8px] text-zinc-500 uppercase">Learning Blocks</span>
          <span className="block text-md font-bold text-success-emerald mt-1">{overview.totalLearningBlocks}</span>
        </div>
        <div className="border border-border-subtle bg-black p-3.5 rounded-lg">
          <span className="block text-[8px] text-zinc-500 uppercase">Bug Studies</span>
          <span className="block text-md font-bold text-white mt-1">{overview.totalBugReportStudyBlocks}</span>
        </div>
        <div className="border border-border-subtle bg-black p-3.5 rounded-lg">
          <span className="block text-[8px] text-zinc-500 uppercase">Recon Sessions</span>
          <span className="block text-md font-bold text-white mt-1">{overview.totalReconSessions}</span>
        </div>
        <div className="border border-border-subtle bg-black p-3.5 rounded-lg">
          <span className="block text-[8px] text-zinc-500 uppercase">Targets Tested</span>
          <span className="block text-md font-bold text-white mt-1">{overview.totalTargetsTested}</span>
        </div>
        <div className="border border-border-subtle bg-black p-3.5 rounded-lg">
          <span className="block text-[8px] text-zinc-500 uppercase">Total Findings</span>
          <span className="block text-md font-bold text-warning-amber mt-1">{overview.totalFindings}</span>
        </div>
        <div className="border border-border-subtle bg-black p-3.5 rounded-lg">
          <span className="block text-[8px] text-zinc-500 uppercase">Active Targets</span>
          <span className="block text-md font-bold text-zinc-300 mt-1">{overview.activeTargets}</span>
        </div>
        <div className="border border-border-subtle bg-black p-3.5 rounded-lg">
          <span className="block text-[8px] text-zinc-500 uppercase">Active Topics</span>
          <span className="block text-md font-bold text-zinc-300 mt-1">{overview.activeLearningTopics}</span>
        </div>
      </div>

      {/* 3. Time & Effort Allocation */}
      <Panel>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-subtle pb-4 mb-4">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Clock size={13} className="text-accent-cyan" /> Effort Allocation Over Time
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Visualize the count of completed work blocks over chosen intervals.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Metric Selector Dropdown */}
            <select
              value={allocationMetric}
              onChange={(e) => setAllocationMetric(e.target.value as any)}
              className="bg-black border border-border-subtle text-zinc-300 font-mono text-[10px] rounded px-2.5 py-1 uppercase focus:outline-none focus:border-accent-cyan"
            >
              <option value="learningBlocks">Learning Blocks Completed</option>
              <option value="bugReportStudyBlocks">Security Report Studies</option>
              <option value="reconSessions">Research Sessions Completed</option>
              <option value="targetsTested">Target Systems Evaluated</option>
              <option value="findings">Security Findings Logged</option>
            </select>

            {/* Interval Selector Tabs */}
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
        </div>

        <div className="space-y-2">
          {allocationChartData.length > 1 ? (
            <LineChart data={allocationChartData} height={200} />
          ) : (
            <div className="h-48 border border-border-subtle/50 bg-black rounded-lg flex items-center justify-center font-mono text-[10px] text-zinc-600">
              // INSUFFICIENT_TIMELINE_ALLOCATION_SERIES
            </div>
          )}
        </div>
      </Panel>

      {/* 4. Target Investment Efficiency */}
      <Panel>
        <div className="border-b border-border-subtle pb-4 mb-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Target size={13} className="text-accent-cyan" /> Target Yield & Efficiency Matrix
          </h3>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Focusing on yield density (accepted reports per session). Click headers to sort.</p>
        </div>

        {targetInvestment.length === 0 ? (
          <EmptyState title="No Active Targets" description="Investment metrics compile once hunting logs are recorded." />
        ) : (
          <div className="border border-border-subtle rounded-lg overflow-hidden bg-black font-mono text-[11px] overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-zinc-950 border-b border-border-subtle text-zinc-500 text-[9px] uppercase">
                <tr>
                  <th className="py-3 px-4 text-zinc-400 font-bold">Target</th>
                  <th className="py-3 px-4 text-right cursor-pointer hover:bg-zinc-900" onClick={() => toggleTargetSort("sessions")}>
                    <div className="flex items-center justify-end gap-1">
                      Sessions {targetSortField === "sessions" && (targetSortOrder === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right cursor-pointer hover:bg-zinc-900" onClick={() => toggleTargetSort("reports")}>
                    <div className="flex items-center justify-end gap-1">
                      Reports {targetSortField === "reports" && (targetSortOrder === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right cursor-pointer hover:bg-zinc-900" onClick={() => toggleTargetSort("acceptedReports")}>
                    <div className="flex items-center justify-end gap-1">
                      Accepted {targetSortField === "acceptedReports" && (targetSortOrder === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right cursor-pointer hover:bg-zinc-900" onClick={() => toggleTargetSort("productivityScore")}>
                    <div className="flex items-center justify-end gap-1">
                      Target Score {targetSortField === "productivityScore" && (targetSortOrder === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right cursor-pointer hover:bg-zinc-900" onClick={() => toggleTargetSort("efficiency")}>
                    <div className="flex items-center justify-end gap-1 text-accent-cyan">
                      Yield/Session {targetSortField === "efficiency" && (targetSortOrder === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50 text-zinc-300">
                {sortedTargets.map((row) => (
                  <tr key={row.targetId} className="hover:bg-zinc-950/60 transition-colors">
                    <td className="py-3 px-4 font-bold uppercase text-white">{row.name}</td>
                    <td className="py-3 px-4 text-right">{row.sessions}</td>
                    <td className="py-3 px-4 text-right text-warning-amber">{row.reports}</td>
                    <td className="py-3 px-4 text-right text-success-emerald font-bold">{row.acceptedReports}</td>
                    <td className="py-3 px-4 text-right">{row.productivityScore}</td>
                    <td className="py-3 px-4 text-right text-accent-cyan font-bold">
                      {row.efficiency.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* 5. Learning Rankings & Comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Learning Topic Yields */}
        <Panel>
          <div className="border-b border-border-subtle pb-3 mb-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Award size={13} className="text-success-emerald" /> Learning Topic Rankings
            </h4>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Ranks study topics by completed learning sessions and frequency.</p>
          </div>
          {learningInvestment.length === 0 ? (
            <p className="text-[10px] font-mono text-zinc-600">// NO_LEARNING_TOPICS_FOUND</p>
          ) : (
            <div className="space-y-2.5 font-mono text-[11px]">
              {learningInvestment.slice(0, 5).map((tp, idx) => (
                <div key={tp.topicId} className="flex justify-between items-center bg-black/40 border border-border-subtle/40 p-2.5 rounded hover:border-success-emerald/20 transition-all">
                  <div className="flex flex-col gap-0.5">
                    <span className="truncate uppercase text-zinc-200 font-bold">{idx + 1}. {tp.name}</span>
                    <span className="text-[9px] text-zinc-500">
                      {tp.recentActivityDays !== null ? `${tp.recentActivityDays} days since last studied` : "Never studied"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-success-emerald font-bold block">{tp.learningBlocks} Sessions</span>
                    <span className="text-[9px] text-zinc-500">{tp.studyFrequencyWeeks} weeks active</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Period Progress Comparisons */}
        <Panel>
          <div className="border-b border-border-subtle pb-3 mb-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <TrendingUp size={13} className="text-accent-cyan" /> Period-over-Period Performance
            </h4>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Historical comparisons of productivity scores against previous periods.</p>
          </div>
          <div className="border border-border-subtle rounded-lg overflow-hidden bg-black font-mono text-[11px]">
            <table className="w-full text-left">
              <thead className="bg-zinc-950 border-b border-border-subtle text-zinc-500 text-[9px] uppercase">
                <tr>
                  <th className="py-2.5 px-4 text-zinc-400">Comparison Scope</th>
                  <th className="py-2.5 px-4 text-right">Current Period</th>
                  <th className="py-2.5 px-4 text-right">Previous Period</th>
                  <th className="py-2.5 px-4 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50 text-zinc-300">
                {periodComparisons.map((row, idx) => {
                  const isNegative = row.change.startsWith("-");
                  const colorClass = isNegative ? "text-danger-rose" : "text-success-emerald";
                  return (
                    <tr key={idx} className="hover:bg-zinc-950/60">
                      <td className="py-3 px-4 font-bold text-white">{row.metric}</td>
                      <td className="py-3 px-4 text-right">{row.currentPeriod}</td>
                      <td className="py-3 px-4 text-right">{row.previousPeriod}</td>
                      <td className={`py-3 px-4 text-right font-bold ${colorClass}`}>{row.change}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

      </div>

      {/* 6. Habits Trends */}
      <Panel>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4 mb-4">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-success-emerald" /> Long-Term Habits Evolution
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Plotting monthly compliance trends over the last 6 months.</p>
          </div>
          <div className="flex flex-wrap bg-black border border-border-subtle p-0.5 rounded font-mono text-[9px] gap-0.5">
            {[
              { id: "recoveryConsistency", label: "Recovery Compliance" },
              { id: "averageSleep", label: "Sleep Duration" },
              { id: "readingCompliance", label: "Bedtime Reading" },
              { id: "workoutFrequency", label: "Workout Frequency" },
              { id: "productivityTrend", label: "Productivity Trend" }
            ].map(habit => (
              <button
                key={habit.id}
                onClick={() => setActiveHabitTrend(habit.id as any)}
                className={`px-2 py-1 uppercase font-bold transition-all rounded-sm cursor-pointer ${activeHabitTrend === habit.id ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                {habit.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {habitTrendChartData.length > 1 ? (
            <LineChart data={habitTrendChartData} height={180} />
          ) : (
            <div className="h-44 border border-border-subtle/50 bg-black rounded-lg flex items-center justify-center font-mono text-[10px] text-zinc-600">
              // INDEXING_LONG_TERM_HABIT_TRENDS
            </div>
          )}
        </div>
      </Panel>

      {/* 7. Records & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Personal Records */}
        <Panel>
          <div className="border-b border-border-subtle pb-3 mb-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Flame size={13} className="text-warning-amber" /> Parth's Personal Records
            </h4>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Your highest tracked performance extremes generated dynamically.</p>
          </div>
          <div className="divide-y divide-zinc-800 font-mono text-xs">
            {personalRecords.map((rec, idx) => (
              <div key={idx} className="py-3 flex justify-between items-center hover:bg-zinc-950/20 px-1 rounded transition-colors">
                <span className="text-zinc-400 font-bold">{rec.name}</span>
                <div className="text-right">
                  <span className="text-white font-bold block">{rec.value}</span>
                  <span className="text-[10px] text-zinc-500">{rec.dateOrInterval}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Growth Milestone Timeline */}
        <Panel>
          <div className="border-b border-border-subtle pb-3 mb-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Zap size={13} className="text-accent-cyan" /> Growth Milestones & Timeline
            </h4>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Career milestones compiled automatically from logs history.</p>
          </div>
          <div className="space-y-3 pt-1">
            {growthTimeline.map((stone, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 border border-zinc-900 rounded bg-zinc-950/30">
                <div className="flex items-center gap-2">
                  <span className={`text-[12px] ${stone.unlocked ? "text-success-emerald" : "text-zinc-600"}`}>
                    {stone.unlocked ? "🟢" : "🔒"}
                  </span>
                  <span className={`text-xs font-mono font-semibold ${stone.unlocked ? "text-zinc-200" : "text-zinc-500 line-through decoration-zinc-700"}`}>
                    {stone.name}
                  </span>
                </div>
                {stone.unlocked && stone.dateUnlocked && (
                  <span className="text-[10px] font-mono text-zinc-500">
                    {new Date(stone.dateUnlocked).toLocaleDateString([], { dateStyle: "medium" })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Panel>

      </div>

    </div>
  );
}