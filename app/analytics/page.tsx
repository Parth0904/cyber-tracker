"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
          <span className="text-sm font-mono tracking-widest text-slate-500 uppercase animate-pulse">
            Analyzing Datasets...
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-cyan-500" />
            <span className="font-bold tracking-wider text-sm uppercase text-slate-300">
              Cyber Tracker
            </span>
          </div>

          <nav className="flex gap-1 text-sm font-medium text-slate-400">
            <Link
              href="/"
              className="px-4 py-2 rounded-md hover:text-slate-200 transition-colors"
            >
              Dashboard
            </Link>

            <Link
              href="/history"
              className="px-4 py-2 rounded-md hover:text-slate-200 transition-colors"
            >
              History
            </Link>

            <Link
              href="/analytics"
              className="px-4 py-2 rounded-md bg-slate-800 text-cyan-400 transition-colors"
            >
              Analytics
            </Link>

            <Link
              href="/insights"
              className="px-4 py-2 rounded-md hover:text-slate-200 transition-colors"
            >
              Insights
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-100">
            Aggregated Analytics
          </h1>

          <p className="text-xs text-slate-400 mt-1">
            Historical metric compilation across active testing frameworks and
            life systems.
          </p>
        </div>

        {/* Output Metrics */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Core Performance Vectors
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 backdrop-blur-md shadow-lg">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Total Recon
              </h3>

              <p className="text-4xl font-black font-mono tracking-tight text-slate-200">
                {data.totalRecon}
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 backdrop-blur-md shadow-lg">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Total Targets
              </h3>

              <p className="text-4xl font-black font-mono tracking-tight text-slate-200">
                {data.totalTargets}
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 backdrop-blur-md shadow-lg ring-1 ring-amber-500/10">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400/80 mb-1">
                Total Findings
              </h3>

              <p className="text-4xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-orange-500">
                {data.totalFindings}
              </p>
            </div>
          </div>
        </div>

        {/* Recovery Metrics */}
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            Recovery Metrics
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950/50 border border-slate-800/40 rounded-lg p-4">
              <h3 className="text-xs font-medium text-slate-400 mb-1">
                Average Sleep
              </h3>

              <p className="text-2xl font-bold font-mono text-slate-200">
                {gridSafeNumber(data.avgSleep)}
                <span className="text-sm font-normal text-slate-500 ml-1">
                  h
                </span>
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/40 rounded-lg p-4">
              <h3 className="text-xs font-medium text-slate-400 mb-1">
                Workout Days
              </h3>

              <p className="text-2xl font-bold font-mono text-emerald-400">
                {data.workoutDays}
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/40 rounded-lg p-4">
              <h3 className="text-xs font-medium text-slate-400 mb-1">
                Reading Before Bed
              </h3>

              <p className="text-2xl font-bold font-mono text-slate-200">
                {Math.round(data.avgReadingBeforeBed || 0)}
                <span className="text-sm font-normal text-slate-500 ml-1">
                  min
                </span>
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/40 rounded-lg p-4">
              <h3 className="text-xs font-medium text-slate-400 mb-1">
                No Screen Before Bed
              </h3>

              <p className="text-2xl font-bold font-mono text-slate-200">
                {gridSafeNumber(data.avgNoScreenHours)}
                <span className="text-sm font-normal text-slate-500 ml-1">
                  h
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Learning Metrics */}
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            Learning Metrics
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/50 border border-slate-800/40 rounded-lg p-4">
              <h3 className="text-xs font-medium text-slate-400 mb-1">
                Average Learning
              </h3>

              <p className="text-2xl font-bold font-mono text-cyan-400">
                {gridSafeNumber(data.avgLearning)}
                <span className="text-sm font-normal text-slate-500 ml-1">
                  h
                </span>
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/40 rounded-lg p-4">
              <h3 className="text-xs font-medium text-slate-400 mb-1">
                Bug Report Study
              </h3>

              <p className="text-2xl font-bold font-mono text-purple-400">
                {Math.round(data.avgBugReportStudy || 0)}
                <span className="text-sm font-normal text-slate-500 ml-1">
                  min
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Focus */}
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            Cognitive Qualifiers
          </h2>

          <div className="bg-slate-950/50 border border-slate-800/40 rounded-lg p-4">
            <h3 className="text-xs font-medium text-slate-400 mb-2">
              Dominant Focus Feeling
            </h3>

            <span className="inline-flex self-start text-xs font-semibold px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
              {data.focusFeeling || "N/A"}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}

function gridSafeNumber(val: any): string {
  const parsed = Number(val);
  return isNaN(parsed) ? "0.0" : parsed.toFixed(1);
}