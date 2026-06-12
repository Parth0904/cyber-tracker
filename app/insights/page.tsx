"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function InsightsPage() {
  const [data, setData] = useState<any>(null);
  const [sleepData, setSleepData] = useState<any>(null);
  const [noScreenData, setNoScreenData] = useState<any>(null);
  const [wakeTimeData, setWakeTimeData] = useState<any>(null);

  // Fallback map matching data tiers to theme color indicators safely
  const confidenceColor: Record<string, string> = {
    Low: "text-rose-400 bg-rose-500/5 border-rose-500/10",
    Medium: "text-amber-400 bg-amber-500/5 border-amber-500/10",
    High: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10",
  };

  // Mock definition placeholder - maps into your global helper or layout layer
  const getConfidence = (days: number): string => {
    if (days >= 14) return "High";
    if (days >= 5) return "Medium";
    return "Low";
  };

  useEffect(() => {
    fetch("/api/insights")
      .then((res) => res.json())
      .then(setData);

    fetch("/api/insights/sleep")
      .then((res) => res.json())
      .then(setSleepData);

    fetch("/api/insights/no-screen")
      .then((res) => res.json())
      .then(setNoScreenData);

    fetch("/api/insights/wake-time")
      .then((res) => res.json())
      .then(setWakeTimeData);
  }, []);

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
          <span className="text-sm font-mono tracking-widest text-slate-500 uppercase animate-pulse">
            Correlating Vectors...
          </span>
        </div>
      </main>
    );
  }

  const difference = data.workoutAverage - data.noWorkoutAverage;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-cyan-500" />
            <span className="font-bold tracking-wider text-sm uppercase text-slate-300">Cyber Tracker</span>
          </div>
          <nav className="flex gap-1 text-sm font-medium text-slate-400">
            <Link href="/" className="px-4 py-2 rounded-md hover:text-slate-200 transition-colors">
              Dashboard
            </Link>
            <Link href="/history" className="px-4 py-2 rounded-md hover:text-slate-200 transition-colors">
              History
            </Link>
            <Link href="/analytics" className="px-4 py-2 rounded-md hover:text-slate-200 transition-colors">
              Analytics
            </Link>
            <Link href="/insights" className="px-4 py-2 rounded-md bg-slate-800 text-cyan-400 transition-colors">
              Insights
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-100">
            Performance Insights
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing behavioral correlations to map environmental triggers against maximum testing output.
          </p>
        </div>

        {/* Section 1: Workout Impact Split View */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 shadow-xl backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Biometric Filter: Workout Impact
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mt-1">
                <span>Confidence:</span>
                <span className={`font-bold ${confidenceColor[getConfidence(data.workoutDays + data.noWorkoutDays)] || "text-slate-400"}`}>
                  {getConfidence(data.workoutDays + data.noWorkoutDays)}
                </span>
              </div>
            </div>
            
            <div className={`text-xs px-2.5 py-1 rounded-md font-mono font-bold border ${
              difference >= 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}>
              Net Shift: {difference >= 0 ? "+" : ""}{difference.toFixed(1)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/50 border border-slate-800/40 rounded-lg p-4 flex justify-between items-center">
              <div>
                <h3 className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Active Training</h3>
                <p className="text-2xl font-black font-mono text-slate-200 mt-1">{data.workoutAverage.toFixed(1)}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-500 block">Sample Pool</span>
                <span className="text-sm font-bold text-slate-400 font-mono">{data.workoutDays} Days</span>
              </div>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/40 rounded-lg p-4 flex justify-between items-center">
              <div>
                <h3 className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Sedentary Baseline</h3>
                <p className="text-2xl font-black font-mono text-slate-400 mt-1">{data.noWorkoutAverage.toFixed(1)}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-500 block">Sample Pool</span>
                <span className="text-sm font-bold text-slate-500 font-mono">{data.noWorkoutDays} Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Sleep Impact 3-Column Split */}
        {sleepData && (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="border-b border-slate-800/60 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Sleep Duration Correlation
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mt-1">
                <span>Confidence:</span>
                <span className={`font-bold ${confidenceColor[getConfidence(sleepData.low.days + sleepData.medium.days + sleepData.high.days)] || "text-slate-400"}`}>
                  {getConfidence(sleepData.low.days + sleepData.medium.days + sleepData.high.days)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950/40 border border-slate-800/40 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-rose-400 font-mono">{"< 6 Hours (Deprived)"}</h3>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-2xl font-black font-mono text-slate-200">{sleepData.low.average.toFixed(1)}</span>
                  <span className="text-xs text-slate-500 font-mono">{sleepData.low.days}d pooled</span>
                </div>
              </div>

              <div className="bg-slate-950/40 border border-slate-800/40 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-cyan-400 font-mono">6 - 8 Hours (Optimal)</h3>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-2xl font-black font-mono text-slate-200">{sleepData.medium.average.toFixed(1)}</span>
                  <span className="text-xs text-slate-500 font-mono">{sleepData.medium.days}d pooled</span>
                </div>
              </div>

              <div className="bg-slate-950/40 border border-slate-800/40 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-slate-400 font-mono">{"> 8 Hours (Extended)"}</h3>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-2xl font-black font-mono text-slate-200">{sleepData.high.average.toFixed(1)}</span>
                  <span className="text-xs text-slate-500 font-mono">{sleepData.high.days}d pooled</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: No-Screen Impact 3-Column Split */}
        {noScreenData && (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="border-b border-slate-800/60 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Pre-Bed Wind Down (No Screen Hours)
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mt-1">
                <span>Confidence:</span>
                <span className={`font-bold ${confidenceColor[getConfidence(noScreenData.low.days + noScreenData.medium.days + noScreenData.high.days)] || "text-slate-400"}`}>
                  {getConfidence(noScreenData.low.days + noScreenData.medium.days + noScreenData.high.days)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950/40 border border-slate-800/40 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-slate-500 font-mono">0 - 2 Hours</h3>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-2xl font-black font-mono text-slate-300">{noScreenData.low.average.toFixed(1)}</span>
                  <span className="text-xs text-slate-500 font-mono">{noScreenData.low.days}d pooled</span>
                </div>
              </div>

              <div className="bg-slate-950/40 border border-slate-800/40 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-cyan-400 font-mono">2 - 5 Hours</h3>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-2xl font-black font-mono text-slate-200">{noScreenData.medium.average.toFixed(1)}</span>
                  <span className="text-xs text-slate-500 font-mono">{noScreenData.medium.days}d pooled</span>
                </div>
              </div>

              <div className="bg-slate-950/40 border border-slate-800/40 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-emerald-400 font-mono">5+ Hours</h3>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-2xl font-black font-mono text-slate-200">{noScreenData.high.average.toFixed(1)}</span>
                  <span className="text-xs text-slate-500 font-mono">{noScreenData.high.days}d pooled</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Wake Time Impact 3-Column Split */}
        {wakeTimeData && (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="border-b border-slate-800/60 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Circadian Phase Alignment (Wake Time)
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mt-1">
                <span>Confidence:</span>
                <span className={`font-bold ${confidenceColor[getConfidence(wakeTimeData.early.days + wakeTimeData.normal.days + wakeTimeData.late.days)] || "text-slate-400"}`}>
                  {getConfidence(wakeTimeData.early.days + wakeTimeData.normal.days + wakeTimeData.late.days)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950/40 border border-slate-800/40 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-emerald-400 font-mono">Before 6 AM</h3>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-2xl font-black font-mono text-slate-200">{wakeTimeData.early.average.toFixed(1)}</span>
                  <span className="text-xs text-slate-500 font-mono">{wakeTimeData.early.days}d pooled</span>
                </div>
              </div>

              <div className="bg-slate-950/40 border border-slate-800/40 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-cyan-400 font-mono">6 AM - 8 AM</h3>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-2xl font-black font-mono text-slate-200">{wakeTimeData.normal.average.toFixed(1)}</span>
                  <span className="text-xs text-slate-500 font-mono">{wakeTimeData.normal.days}d pooled</span>
                </div>
              </div>

              <div className="bg-slate-950/40 border border-slate-800/40 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-rose-400 font-mono">After 8 AM</h3>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-2xl font-black font-mono text-slate-200">{wakeTimeData.late.average.toFixed(1)}</span>
                  <span className="text-xs text-slate-500 font-mono">{wakeTimeData.late.days}d pooled</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}