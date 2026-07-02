"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardData } from "@/lib/types/dashboard";

const activityTypes = [
  { label: "Learning", type: "learning" },
  { label: "Bug Report", type: "bug_report" },
  { label: "Recon", type: "recon" },
  { label: "Target", type: "target" },
  { label: "Finding", type: "finding" },
];

export default function Home() {
  const [isSaved, setIsSaved] = useState(false);

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [daily, setDaily] = useState({
    sleep_hours: 0,
    bed_time: "",
    reading: 0,
    focus_feeling: "",
    workout: false,
    steps: 0,
    notes: "",
  });

  const loadDashboard = async () => {
    const res = await fetch("/api/dashboard");
    const data: DashboardData = await res.json();

    setDashboard(data);
  };

  const loadDaily = async () => {
    const res = await fetch("/api/daily");
    const data = await res.json();

    if (Object.keys(data).length) {
      setDaily({
        sleep_hours: data.sleep_hours ?? 0,
        bed_time: data.bed_time ?? "",
        reading: data.reading ?? 0,
        focus_feeling: data.focus_feeling ?? "",
        workout: Boolean(data.workout),
        steps: data.steps ?? 0,
        notes: data.notes ?? "",
      });
    }
  };

  useEffect(() => {
    loadDashboard();
    loadDaily();
  }, []);

  const addActivity = async (type: string) => {
    await fetch("/api/activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type }),
    });

    await loadDashboard();
  };

  const saveDaily = async () => {
    await fetch("/api/daily", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(daily),
    });

    await loadDashboard();
  };

  const handleSave = async () => {
    await saveDaily();

    setIsSaved(true);

    setTimeout(() => {
      setIsSaved(false);
    }, 5000);
  };

  const getPerformanceColor = (status: string) => {
    switch (status) {
      case "Excellent":
      case "Good":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

      case "Poor":
      case "Low":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";

      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  if (!dashboard) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading Dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-cyan-500 animate-pulse" />
            <span className="font-bold tracking-wider text-sm uppercase text-slate-300">Cyber Tracker</span>
          </div>
          <nav className="flex gap-1 text-sm font-medium text-slate-400">
            <Link href="/" className="px-4 py-2 rounded-md bg-slate-800 text-cyan-400 transition-colors">
              Dashboard
            </Link>
            <Link href="/history" className="px-4 py-2 rounded-md hover:text-slate-200 transition-colors">
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

      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Today's Completion
            </h2>

            <div className="text-4xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-500 mt-2">
              {dashboard.completion.percent}%
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500">
              Missing
            </div>

            <div className="text-lg font-bold text-amber-400">
              {dashboard.completion.missingCount}
            </div>
          </div>

        </div>

        {dashboard.completion.missing.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800">

            <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">
              Remaining
            </div>

            <div className="flex flex-wrap gap-2">

              {dashboard.completion.missing.map((item) => (

                <span
                  key={item}
                  className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300"
                >
                  {item}
                </span>

              ))}

            </div>

          </div>
        )}
      </div>
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 shadow-xl backdrop-blur-md">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Today's Focus
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              The highest-impact recommendation based on your habits.
            </p>

          </div>

          <Link
            href="/insights"
            className="text-sm text-cyan-400 hover:text-cyan-300"
          >
            View All →
          </Link>

        </div>

        <div className="mt-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">

          <div className="flex items-center justify-between">

            <div>

              <div className="text-xs uppercase tracking-wider text-cyan-400">
                Focus Habit
              </div>

              <h3 className="text-2xl font-bold text-slate-100 mt-1">
                {dashboard.focus.habit}
              </h3>

            </div>

            <span
              className={`px-3 py-1 rounded-full border text-xs font-medium ${getPerformanceColor(dashboard.focus.strength)
                }`}
            >
              {dashboard.focus.strength}
            </span>

          </div>

          <div className="mt-5">

            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
              Recommendation
            </div>

            <p className="text-slate-200">
              {dashboard.focus.recommendation}
            </p>

          </div>

          <div className="mt-5">

            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
              Why
            </div>

            <p className="text-slate-400 leading-relaxed">
              {dashboard.focus.explanation}
            </p>

          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">

            <span className="text-xs text-slate-500">
              Confidence
            </span>

            <span className="text-sm font-medium text-slate-300">
              {dashboard.focus.confidence}
            </span>

          </div>

        </div>

      </div>

      {/* Row 1: High Level Metrics Overviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Today's Productivity
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Compared against your own historical average.
              </p>

            </div>

            <span
              className={`px-3 py-1 rounded-full border text-xs font-medium ${getPerformanceColor(
                dashboard.productivity.level
              )}`}
            >
              {dashboard.productivity.level}
            </span>

          </div>

          <div className="mt-8">

            <div className="text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-500">
              {dashboard.productivity.level}
            </div>

            <p className="text-slate-400 mt-3 leading-relaxed">
              {dashboard.productivity.reason}
            </p>

          </div>

          {dashboard.productivity.contributors.length > 0 && (

            <div className="mt-8 border-t border-slate-800 pt-5">

              <div className="text-xs uppercase tracking-wider text-slate-500 mb-3">
                Biggest Contributors
              </div>

              <div className="flex flex-wrap gap-2">

                {dashboard.productivity.contributors.map((item) => (

                  <span
                    key={item.type}
                    className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs"
                  >
                    {item.type.replace("_", " ")}
                  </span>

                ))}

              </div>

            </div>

          )}

        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 shadow-xl backdrop-blur-md">

          <div className="flex items-center justify-between mb-5">

            <div>

              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Today's Activity
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Events that contributed to today's productivity.
              </p>

            </div>

          </div>

          {dashboard.productivity.contributors.length === 0 ? (

            <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">

              <p className="text-slate-400">
                No work recorded yet.
              </p>

              <p className="text-xs text-slate-500 mt-2">
                Start logging Learning, Recon or Targets.
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {dashboard.productivity.contributors.map((item) => (

                <div
                  key={item.type}
                  className="flex items-center justify-between rounded-lg bg-slate-950/50 border border-slate-800 px-4 py-3"
                >

                  <span className="text-slate-200 capitalize">
                    {item.type.replace("_", " ")}
                  </span>

                  <span className="text-cyan-400 font-semibold">
                    +{item.contribution}
                  </span>

                </div>

              ))}

            </div>

          )}

        </div>

        {/* Row 2: Actions & Data Ingestion Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Action Trigger Pad */}
          <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 shadow-xl backdrop-blur-md">
            <h2 className="text-lg font-bold text-slate-200 mb-1">Increment Activity</h2>
            <p className="text-xs text-slate-400 mb-4">Click to register a completed event in realtime.</p>
            <div className="grid grid-cols-2 gap-3">
              {activityTypes.map((item) => (
                <button
                  key={item.type}
                  onClick={() => addActivity(item.type)}
                  className="bg-linear-to-b from-slate-800 to-slate-900 hover:from-cyan-900/40 hover:to-slate-900 border border-slate-700/60 hover:border-cyan-500/50 text-slate-200 font-medium rounded-xl p-4 text-center transition-all duration-200 shadow-sm active:scale-95 flex flex-col items-center justify-center gap-1 group"
                >
                  <span className="text-xs text-cyan-400 group-hover:scale-110 transition-transform font-bold">+ Add</span>
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Daily Input Forms Context */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 shadow-xl backdrop-blur-md">
            <h2 className="text-lg font-bold text-slate-200 mb-1">
              Daily Habits
            </h2>

            <p className="text-xs text-slate-400 mb-4">
              Record the habits that may influence your productivity.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Sleep Hours</label>
                <div className="flex flex-wrap gap-2">
                  {[5, 6, 7, 8, 9, 10].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setDaily({ ...daily, sleep_hours: h })}
                      className={`px-3 py-2 rounded-lg text-sm transition ${daily.sleep_hours == h
                        ? "bg-cyan-500 text-slate-950"
                        : "bg-slate-950 border border-slate-800 text-slate-300 hover:border-cyan-500"
                        }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
               
              <label className="text-xs font-semibold text-slate-400">
                Bed Time
              </label>

              <input
                type="time"
                value={daily.bed_time}
                onChange={(e) =>
                  setDaily({
                    ...daily,
                    bed_time: e.target.value,
                  })
                }
                className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Focus Feeling</label>
                <div className="flex flex-wrap gap-2">
                  {["Distracted", "Focused", "Deep", "Flow State"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        setDaily({
                          ...daily,
                          focus_feeling: level,
                        })
                      }
                      className={`px-3 py-2 rounded-lg text-sm transition ${daily.focus_feeling === level
                        ? "bg-cyan-500 text-slate-950"
                        : "bg-slate-950 border border-slate-800 text-slate-300 hover:border-cyan-500"
                        }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
  <label className="text-xs font-semibold text-slate-400">
    Reading
  </label>

  <div className="flex flex-wrap gap-2">
    {[0, 15, 30, 45, 60, 90, 120].map((m) => (
      <button
        key={m}
        type="button"
        onClick={() =>
          setDaily({
            ...daily,
            reading: m,
          })
        }
        className={`px-3 py-2 rounded-lg text-sm transition ${
          daily.reading === m
            ? "bg-cyan-500 text-slate-950"
            : "bg-slate-950 border border-slate-800 text-slate-300 hover:border-cyan-500"
        }`}
      >
        {m}m
      </button>
    ))}
  </div>
</div>

<div className="flex flex-col gap-1.5">
  <label className="text-xs font-semibold text-slate-400">
    Steps
  </label>

  <div className="flex flex-wrap gap-2">
    {[0, 3000, 5000, 8000, 10000, 15000].map((steps) => (
      <button
        key={steps}
        type="button"
        onClick={() =>
          setDaily({
            ...daily,
            steps,
          })
        }
        className={`px-3 py-2 rounded-lg text-sm transition ${
          daily.steps === steps
            ? "bg-cyan-500 text-slate-950"
            : "bg-slate-950 border border-slate-800 text-slate-300 hover:border-cyan-500"
        }`}
      >
        {steps >= 1000 ? `${steps / 1000}k` : steps}
      </button>
    ))}
  </div>
</div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-400">Notes</label>
                <textarea
                  value={daily.notes || ""}
                  onChange={(e) =>
                    setDaily({
                      ...daily,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Anything unusual that affected your day?"
                  rows={3}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none"
                />
              </div>

            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between gap-4">
              <label className="flex items-center gap-2.5 text-sm select-none cursor-pointer text-slate-300 group">
                <div className="flex gap-2">
                  {[true, false].map((value) => (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() =>
                        setDaily({
                          ...daily,
                          workout: value,
                        })
                      }
                      className={`px-4 py-2 rounded-lg text-sm transition ${daily.workout === value
                        ? "bg-cyan-500 text-slate-950"
                        : "bg-slate-950 border border-slate-800 text-slate-300 hover:border-cyan-500"
                        }`}
                    >
                      {value ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
                <span className="group-hover:text-slate-100 transition-colors">Workout</span>
              </label>

              <button
                onClick={handleSave}
                className={`font-semibold px-5 py-2.5 rounded-lg text-sm transition-all shadow-md active:scale-[0.98] ${isSaved
                  ? 'bg-emerald-500 text-white cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                  }`}
              >
                {isSaved ? '✓ Saved!' : 'Save Metrics Log'}
              </button>
            </div>

          </div>

        </div>

      </div>
    </main >
  );
}