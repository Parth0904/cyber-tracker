"use client";

import * as React from "react";
import { Terminal, Shield } from "lucide-react";
import DashboardStats from "@/components/dashboard/DashboardStats";
import WeeklyTrend from "@/components/dashboard/WeeklyTrend";
import ActiveTarget from "@/components/dashboard/ActiveTarget";
import InsightsWidget from "@/components/dashboard/InsightsWidget";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { DailyHabitsForm } from "@/components/dashboard/forms/DailyHabitsForm";
import {SessionHudWidget} from "@/components/dashboard/SessionHudWidget";

type DashboardPayload = {
  stats: { currentStreak: number; allTimeHigh: number; completionRate: number; hoursInvested: number; findingsCount: number };
  weeklyTrend: { activityData: number[]; currentWeekAvg: number; previousWeekAvg: number };
  activeTarget: { name: string; status: string; hours: number; findings: number; reports: number } | null;
  insights: { id?: string; text: string; impact: "high" | "medium" | "low"; confidence: number }[];
  activities: { id: string; timestamp: string; title: string; category: "habit" | "target" | "system"; meta?: string }[];
};

export default function DashboardConsoleHome() {
  const [data, setData] = React.useState<DashboardPayload | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function synchronizeDashboardConsole() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Dashboard engine line loop drop:", err);
      } finally {
        setLoading(false);
      }
    }
    synchronizeDashboardConsole();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
        // ESTABLISHING_SECURE_COMMAND_SHELL_TUNNELS...
      </div>
    );
  }

  const trend = data?.weeklyTrend || { activityData: [], currentWeekAvg: 0, previousWeekAvg: 0 };
  const insights = data?.insights || [];
  const activities = data?.activities || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 text-zinc-200">
      
      {/* 1. TOP MARQUEE CONTROL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white uppercase font-mono flex items-center gap-2">
            <Terminal className="w-4 h-4 text-accent-cyan" /> Operator Center Terminal // Cyber Tracker HUD
          </h1>
          <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
            DUAL TRACK SYSTEM // SYSTEM OPERATIONAL & SYSTEM PERFORMANCE METRIC FABRICS ACTIVE.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[9px] bg-black border border-border-subtle px-2.5 py-1 rounded-md text-zinc-400">
          <Shield size={11} className="text-success-emerald" /> SECURE TUNNEL // HYBRID PIPELINE ONLINE
        </div>
      </div>

      {/* 2. QUICK STATS OVERVIEW */}
      <DashboardStats stats={data?.stats} />

      {/* 3. PERFORMANCE WORKFLOW: DAILY HABITS INTEGRATION BARRIER */}
      <div className="p-1 border border-border-subtle bg-black/40 rounded-xl p-4">
        <DailyHabitsForm />
      </div>

      {/* 4. OPERATIONAL WORKFLOW: METRICS GRIDS & WEEKLY SEGMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <WeeklyTrend 
            activityData={trend.activityData} 
            currentWeekAvg={trend.currentWeekAvg} 
            previousWeekAvg={trend.previousWeekAvg} 
          />
        </div>
        <div className="lg:col-span-1">
          {data?.activeTarget ? (
            <ActiveTarget 
              name={data.activeTarget.name}
              status={data.activeTarget.status}
              hours={data.activeTarget.hours}
              findings={data.activeTarget.findings}
              reports={data.activeTarget.reports}
            />
          ) : (
            <div className="border border-dashed border-border-subtle bg-black rounded-lg p-6 flex flex-col items-center justify-center h-full text-center text-zinc-500 font-mono text-xs">
              <span className="text-[10px] text-zinc-600 block mb-1">// NULL_ACTIVE_WORKSPACE_NODE</span>
              No active target context engaged. Bind an asset code node to stream operations log fields.
            </div>
          )}
        </div>
      </div>

      {/* 5. STREAM DATA INSIGHTS & HISTORICAL AUDITS BLOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <InsightsWidget insights={insights} />
        </div>
        <div className="lg:col-span-2">
          <RecentActivity activities={activities} />
        </div>
      </div>

      {/* PERSISTENT FLOATING TIMING OVERLAY INTERFACE */}
      <SessionHudWidget />

    </div>
  );
}