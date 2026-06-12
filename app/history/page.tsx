"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HistoryPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [activitySummary, setActivitySummary] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then(setEntries);

    fetch("/api/history/summary")
      .then((res) => res.json())
      .then(setActivitySummary);
  }, []);

  const getActivityCount = (date: string, type: string) => {
    const record = activitySummary.find(
      (item) => item.date === date && item.type === type
    );
    return record?.total || 0;
  };

  // Helper for rendering clean qualitative metrics tags
  const getMoodBadgeColor = (status: string) => {
    if (status === "Flow State" || status === "Deep" || status === "Excellent" || status === "Good") {
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    }
    if (status === "Distracted" || status === "Poor") {
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    }
    return "bg-slate-800 text-slate-400 border-slate-700/50";
  };

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
            <Link href="/history" className="px-4 py-2 rounded-md bg-slate-800 text-cyan-400 transition-colors">
              History
            </Link>
            <Link href="/analytics" className="px-4 py-2 rounded-md hover:text-slate-200 transition-colors">
              Analytics
            </Link>
            <Link href="/insights" className="px-4 py-2 rounded-md hover:text-slate-200 transition-colors">
              Insights
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-100">
            Historical Records
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Reviewing retroactive telemetry archives and performance timeline logs.
          </p>
        </div>

        {/* History Log Loop Stack */}
        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
              <p className="text-sm text-slate-500 font-mono">No telemetry archives found.</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 backdrop-blur-md shadow-lg space-y-4 hover:border-slate-800 transition-colors"
              >
                {/* Card Header Section */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-900/50 px-2.5 py-1 rounded">
                      {entry.date}
                    </span>
                    {entry.workout && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
                        Workout
                      </span>
                    )}
                  </div>
                  
                  {/* Basic Biometrics Metadata Line */}
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                    <div>
                      Sleep: <span className="text-slate-200 font-bold">{entry.sleep_hours || "0"}h</span>
                    </div>
                    <div className="h-3 w-px bg-slate-800" />
                    <div>
                      Energy: <span className="text-amber-400 font-bold">{entry.energy || "0"}/10</span>
                    </div>
                  </div>
                </div>

                {/* Grid Subsection: Horizontal Metrics Blocks */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950/40 border border-slate-800/40 rounded-lg px-3 py-2.5">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Labs</div>
                    <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">
                      {getActivityCount(entry.date, "lab_completed")}
                    </div>
                  </div>
                  
                  <div className="bg-slate-950/40 border border-slate-800/40 rounded-lg px-3 py-2.5">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Recon</div>
                    <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">
                      {getActivityCount(entry.date, "recon_session")}
                    </div>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800/40 rounded-lg px-3 py-2.5">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Targets</div>
                    <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">
                      {getActivityCount(entry.date, "target_tested")}
                    </div>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800/40 rounded-lg px-3 py-2.5 ring-1 ring-amber-500/5">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-amber-500/70">Findings</div>
                    <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                      {getActivityCount(entry.date, "finding")}
                    </div>
                  </div>
                </div>

                {/* Card Footer Section: Mental Status Tags */}
                {(entry.focus_feeling || entry.day_feeling) && (
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-slate-500 font-medium">Cognitive Context:</span>
                    {entry.focus_feeling && (
                      <span className={`px-2 py-0.5 rounded border font-mono text-[11px] ${getMoodBadgeColor(entry.focus_feeling)}`}>
                        Focus: {entry.focus_feeling}
                      </span>
                    )}
                    {entry.day_feeling && (
                      <span className={`px-2 py-0.5 rounded border font-mono text-[11px] ${getMoodBadgeColor(entry.day_feeling)}`}>
                        Vibe: {entry.day_feeling}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}