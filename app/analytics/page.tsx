"use client";

import * as React from "react";
import { 
  BarChart3, TrendingUp, DollarSign, Clock, ShieldAlert, 
  Target, Lightbulb, Zap, HelpCircle, Activity 
} from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";

// --- OPERATIONAL TELEMETRY INTELLIGENCE TYPES ---
type KpiMetrics = {
  perfScore: number;
  weeklyGrowth: number;
  avgDailyScore: number;
  focusRate: number;
  successRate: number;
  totalHours: number;
};

type TargetEfficiency = {
  id: string;
  name: string;
  hours: number;
  findings: number;
  rewards: number;
  roiPerHour: number;
};

type HabitCorrelation = {
  habit: string;
  impactMetric: string;
  correlationCoefficient: number;
  confidence: "High" | "Medium" | "Low";
  recommendation: string;
};

type ForecastMatrix = {
  estimatedRewards: number;
  findingProbability: number;
  burnoutRisk: "Low" | "Moderate" | "Elevated";
};

type AnalyticsTelemetryPayload = {
  kpis: KpiMetrics;
  historicalTrend: { label: string; value: number }[];
  distributionTrend: { label: string; value: number }[];
  targetsRoi: TargetEfficiency[];
  correlations: HabitCorrelation[];
  forecast: ForecastMatrix;
};

export default function AnalyticsIntelligencePage() {
  // --- TELEMETRY STATE PIPELINE (No placeholders, starts clean) ---
  const [data, setData] = React.useState<AnalyticsTelemetryPayload | null>(null);
  const [timeRange, setTimeRange] = React.useState<"30d" | "90d" | "all">("30d");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function synchronizeAnalyticsIntelligence() {
      try {
        const res = await fetch(`/api/analytics?range=${timeRange}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Performance intelligence stream synchronization error:", err);
      } finally {
        setLoading(false);
      }
    }
    synchronizeAnalyticsIntelligence();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
        // INDEXING_PERFORMANCE_INTELLIGENCE_FABRICS...
      </div>
    );
  }

  // Safe destructuring fallbacks to fully isolate the UI from unexpected missing property crashes
  const kpis = data?.kpis || { perfScore: 0, weeklyGrowth: 0, avgDailyScore: 0, focusRate: 0, successRate: 0, totalHours: 0 };
  const historicalTrend = data?.historicalTrend || [];
  const distributionTrend = data?.distributionTrend || [];
  const targetsRoi = data?.targetsRoi || [];
  const correlations = data?.correlations || [];
  const forecast = data?.forecast || { estimatedRewards: 0, findingProbability: 0, burnoutRisk: "Low" };

  // Guard check mapping directly to empty state parameters if zero metrics are parsed
  if (!data || historicalTrend.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState 
          title="Performance Intelligence Telemetry Offline" 
          description="Your audit log matrix lacks deep diagnostic indexes. Log active hunting operations to compute tactical productivity indicators."
        />
      </div>
    );
  }

  const getRiskBadgeVariant = (risk: string) => {
    if (risk === "Elevated") return "danger";
    if (risk === "Moderate") return "warning";
    return "success";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-zinc-200">
      
      {/* HEADER CONTROLS NAVIGATION STRIP */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white uppercase font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-cyan" /> Workspace Performance Intelligence Terminal
          </h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">Automated yield modeling, habit optimizations, and target return matrices.</p>
        </div>

        <div className="flex items-center bg-black border border-border-subtle p-1 rounded-md self-start md:self-auto font-mono text-[10px]">
          {(["30d", "90d", "all"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 uppercase font-medium rounded transition-all ${timeRange === range ? "bg-white text-black font-bold" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              TRAILING {range}
            </button>
          ))}
        </div>
      </div>

      {/* 1. EXECUTIVE HERO MODEL & OVERVIEW KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 font-mono">
        <div className="border border-border-subtle bg-card rounded-lg p-4 col-span-2 flex flex-col justify-between">
          <div>
            <span className="block text-[9px] text-zinc-500 uppercase">Operational Performance Score</span>
            <span className="block text-3xl font-bold text-white tracking-tight mt-1">{kpis.perfScore} <span className="text-xs font-normal text-zinc-500">/ 100</span></span>
          </div>
          <p className="text-[11px] text-zinc-400 font-sans mt-2 leading-relaxed">
            Your telemetry score is <span className="text-success-emerald font-mono font-bold">▲ {kpis.weeklyGrowth}% higher</span> than the preceding baseline velocity threshold.
          </p>
        </div>
        
        <div className="border border-border-subtle bg-black rounded-lg p-3.5">
          <span className="block text-[9px] text-zinc-500 uppercase">Avg Daily Score</span>
          <span className="block text-lg font-bold text-white mt-1">{kpis.avgDailyScore.toFixed(1)}</span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-3.5">
          <span className="block text-[9px] text-zinc-500 uppercase">Focus Allocation</span>
          <span className="block text-lg font-bold text-accent-cyan mt-1">{kpis.focusRate}%</span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-3.5">
          <span className="block text-[9px] text-zinc-500 uppercase">Signal Accept</span>
          <span className="block text-lg font-bold text-success-emerald mt-1">{kpis.successRate}%</span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-3.5">
          <span className="block text-[9px] text-zinc-500 uppercase">Hours Tracked</span>
          <span className="block text-lg font-bold text-white mt-1">{kpis.totalHours.toFixed(1)}h</span>
        </div>
      </div>

      {/* 2. MAIN GRAPH LAYOUT DUPLEX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <div className="mb-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <TrendingUp size={13} className="text-accent-cyan" /> Daily Score Velocity
            </h3>
          </div>
          <LineChart data={historicalTrend} height={160} />
        </Panel>

        <Panel>
          <div className="mb-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <BarChart3 size={13} className="text-accent-cyan" /> Vulnerability Action Distribution
            </h3>
          </div>
          <BarChart data={distributionTrend} height={160} />
        </Panel>
      </div>

      {/* 3. TARGET COMPREHENSIVE ROI TABLE MATRIX */}
      <Panel>
        <div className="mb-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Target size={13} /> Target Vector Return On Investment (ROI)
          </h3>
        </div>
        <div className="border border-border-subtle rounded-md overflow-hidden bg-black font-mono text-xs">
          <table className="w-full text-left">
            <thead className="bg-zinc-950 border-b border-border-subtle text-zinc-500 text-[9px] uppercase">
              <tr>
                <th className="p-3">Target Profile Name</th>
                <th className="p-3">Invested Clock</th>
                <th className="p-3">Identified Bugs</th>
                <th className="p-3">Gross Yield</th>
                <th className="p-3 text-right">Yield Efficiency Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50 text-zinc-300">
              {targetsRoi.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-900/30">
                  <td className="p-3 text-white font-semibold font-sans">{t.name}</td>
                  <td className="p-3 text-zinc-400">{t.hours.toFixed(1)}h</td>
                  <td className="p-3 text-zinc-400">{t.findings}</td>
                  <td className="p-3 text-success-emerald">${t.rewards.toLocaleString()}</td>
                  <td className="p-3 text-right font-bold text-white">${t.roiPerHour.toFixed(2)}/hr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* 4. CROSS-TAB HABIT CORRELATIONS DIAGNOSTIC */}
        <div className="lg:col-span-2 space-y-4">
          <Panel>
            <div className="mb-4 border-b border-border-subtle pb-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Lightbulb size={13} className="text-warning-amber" /> Cross-Reference Habit Correlations
              </h3>
            </div>
            
            <div className="space-y-3">
              {correlations.map((c, idx) => (
                <div key={idx} className="border border-border-subtle bg-black p-4 rounded-md flex flex-col sm:flex-row justify-between sm:items-center gap-3 font-mono text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-bold uppercase">{c.habit}</span>
                      <span className="text-zinc-600">➔</span>
                      <span className="text-zinc-400">{c.impactMetric} Impact</span>
                    </div>
                    <p className="font-sans text-[11px] text-zinc-400 leading-relaxed max-w-xl">{c.recommendation}</p>
                  </div>
                  
                  <div className="text-right shrink-0 self-end sm:self-auto flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                    <span className="text-[10px] text-zinc-600 block">CONFIDENCE</span>
                    <Badge variant={c.confidence === "High" ? "success" : "neutral"}>{c.confidence.toUpperCase()}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* 5. predictive MODELING & FORECAST ENGINE */}
        <div className="lg:col-span-1 space-y-4">
          <Panel>
            <div className="mb-3 border-b border-border-subtle pb-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Zap size={13} className="text-accent-cyan" /> Predictive Yield Modeling & Forecasts
              </h3>
            </div>

            <div className="space-y-4 font-mono text-xs pt-1">
              <div>
                <span className="block text-[9px] text-zinc-600 uppercase">Estimated Month Rewards Yield</span>
                <span className="text-sm font-bold text-success-emerald mt-0.5 block">${forecast.estimatedRewards.toLocaleString()}</span>
              </div>
              
              <div>
                <span className="block text-[9px] text-zinc-600 uppercase">Vulnerability Discovery Probability</span>
                <span className="text-sm font-bold text-white mt-0.5 block">{(forecast.findingProbability * 100).toFixed(0)}%</span>
              </div>

              <div className="border-t border-border-subtle/50 pt-3">
                <span className="block text-[9px] text-zinc-600 uppercase mb-1">Burnout System Risk Threshold</span>
                <Badge variant={getRiskBadgeVariant(forecast.burnoutRisk)}>{forecast.burnoutRisk.toUpperCase()}</Badge>
              </div>
            </div>
          </Panel>
        </div>

      </div>
    </div>
  );
}