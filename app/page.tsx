"use client";

import * as React from "react";
import { Shield, Sparkles, CheckCircle2 } from "lucide-react";
import type { DailyStudyTargetResult } from "@/lib/services/metrics/dailyTarget";

interface DashboardResponse {
  dailyTarget?: DailyStudyTargetResult;
  completion?: {
    percent: number;
    completedHours: number;
    targetHours: number;
    remainingHours: number;
  };
}

export default function MinimalistDailyTargetHome() {
  const [data, setData] = React.useState<DashboardResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchTargetData = React.useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const json = (await res.json()) as DashboardResponse;
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load daily work target:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTargetData();
    // Auto refresh every 30 seconds for live sync updates from Windows agent
    const interval = setInterval(fetchTargetData, 30000);
    return () => clearInterval(interval);
  }, [fetchTargetData]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center p-6 bg-black text-zinc-400 font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>INITIALIZING_CANONICAL_WORK_TARGET...</span>
        </div>
      </main>
    );
  }

  const dt = data?.dailyTarget;
  const targetHours = dt?.targetHours ?? data?.completion?.targetHours ?? 8.0;
  const workedHours = dt?.today?.completedHours ?? data?.completion?.completedHours ?? 0.0;
  const remainingHours = dt?.today?.remainingHours ?? data?.completion?.remainingHours ?? Math.max(0, Math.round((targetHours - workedHours) * 10) / 10);
  const progressPercent = dt?.today?.completionPercentage ?? data?.completion?.percent ?? (
    targetHours > 0 ? Math.round((workedHours / targetHours) * 1000) / 10 : 0
  );

  const isDynamicPace = targetHours !== 8.0 || (dt?.explanation && dt.explanation !== "Daily Ideal");
  const explanation = dt?.explanation || "Daily Ideal";

  return (
    <main className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 min-h-[calc(100vh-4rem)] bg-black text-zinc-100 selection:bg-cyan-500/20 selection:text-cyan-200 relative overflow-hidden font-sans">
      {/* Subtle modern ambient background glow */}
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 space-y-8">
        
        {/* Minimal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-400 font-semibold">
              Cyber Tracker // Work Time
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
            <Shield size={12} className="text-cyan-400" />
            <span>Authoritative Windows Agent</span>
          </div>
        </div>

        {/* Minimalist Central Target Card */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl p-8 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
          
          {/* Top Row: Today's Target & Worked */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pb-8 border-b border-zinc-800/60">
            
            {/* 1. Today's Target */}
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider font-mono text-zinc-400 font-medium">
                Today's Target
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl sm:text-6xl font-black text-white tracking-tight font-mono">
                  {targetHours.toFixed(1)}
                </span>
                <span className="text-2xl font-light text-zinc-400">h</span>
              </div>
              {isDynamicPace && (
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
                    <Sparkles size={11} /> {explanation}
                  </span>
                </div>
              )}
            </div>

            {/* 2. Worked */}
            <div className="space-y-2 sm:text-right">
              <div className="text-xs uppercase tracking-wider font-mono text-zinc-400 font-medium">
                Worked
              </div>
              <div className="flex items-baseline sm:justify-end gap-2">
                <span className="text-5xl sm:text-6xl font-black text-cyan-400 tracking-tight font-mono">
                  {workedHours.toFixed(1)}
                </span>
                <span className="text-2xl font-light text-zinc-400">h</span>
              </div>
              <div className="pt-1 font-mono text-[11px] text-zinc-500">
                Verified Active Time
              </div>
            </div>

          </div>

          {/* Bottom Row: Progress & Remaining */}
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
              {/* Progress */}
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider font-mono text-zinc-400 font-medium">
                  Progress
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
                    {workedHours.toFixed(1)} / {targetHours.toFixed(1)} h
                  </span>
                  <span className="text-xl sm:text-2xl font-semibold text-cyan-300 font-mono">
                    {progressPercent.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Remaining */}
              <div className="space-y-1 sm:text-right">
                <div className="text-xs uppercase tracking-wider font-mono text-zinc-400 font-medium">
                  Remaining
                </div>
                <div>
                  {remainingHours <= 0 ? (
                    <span className="text-lg font-bold text-emerald-400 flex items-center sm:justify-end gap-1.5 font-mono">
                      <CheckCircle2 size={18} /> Target Met
                    </span>
                  ) : (
                    <span className="text-2xl sm:text-3xl font-bold text-amber-400 tracking-tight font-mono">
                      {remainingHours.toFixed(1)} h
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-zinc-900 rounded-full h-3 overflow-hidden border border-zinc-800 p-0.5 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  workedHours >= targetHours
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                    : "bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                }`}
                style={{
                  width: `${Math.min(100, Math.max(1, progressPercent))}%`,
                }}
              />
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}