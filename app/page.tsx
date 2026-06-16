"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Stats = {
  [key: string]: number;
};

const activityTypes = [
  { label: "Target", type: "target_tested" },
  { label: "Recon", type: "recon_session" },
  { label: "Finding", type: "finding" },
];

export default function Home() {
  const [isSaved, setIsSaved] = useState(false);
  const [stats, setStats] = useState<Stats>({});
  const [summary, setSummary] = useState<any>(null);
  const [averageOutput, setAverageOutput] = useState(0);
  const [remark, setRemark] = useState({
    score: 0,
    remark: "Poor",
  });
  const [daily, setDaily] = useState({
    sleep_hours: "",
    wake_time: "",
    workout: false,

    learning_hours: "",

    reading_before_bed_minutes: "",
    bug_report_study_minutes: "",

    no_screen_hours: "",

    focus_feeling: "",

    notes: "",
  });
  const [outputData, setOutputData] = useState({
    recon: 0,
    targets: 0,
    findings: 0,
    output: 0,
  });

  const loadRemark = async () => {
    const res = await fetch("/api/remark");
    const data = await res.json();
    setRemark(data);
  };

  const loadAverageOutput = async () => {
    const res = await fetch("/api/output/average");
    const data = await res.json();
    setAverageOutput(data.average);
  };

  const loadOutput = async () => {
    const res = await fetch("/api/output");
    const data = await res.json();
    setOutputData(data);
  };

  const loadStats = async () => {
    const res = await fetch("/api/stats");
    const data = await res.json();
    const mapped: Stats = {};
    data.forEach((row: any) => {
      mapped[row.type] = row.total;
    });
    setStats(mapped);
  };

  const loadDaily = async () => {
    const res = await fetch("/api/daily");
    const data = await res.json();
    if (Object.keys(data).length) {
      setDaily(data);
    }
  };

  useEffect(() => {
    loadRemark();
    loadStats();
    loadDaily();
    loadOutput();
    loadAverageOutput();

    fetch("/api/insights/summary")
      .then((res) => res.json())
      .then(setSummary);
  }, []);

  const addActivity = async (type: string) => {
    await fetch("/api/activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type }),
    });
    loadStats();
    loadOutput();
    loadAverageOutput();
  };

  const saveDaily = async () => {
    await fetch("/api/daily", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(daily),
    });
  };

  const handleSave = () => {
    saveDaily();
    setIsSaved(true);

    setTimeout(() => {
      setIsSaved(false);
    }, 5000); // 5000 milliseconds = 5 seconds
  };

  const completionItems = [
    daily.sleep_hours,
    daily.wake_time,
    daily.reading_before_bed_minutes,
    daily.no_screen_hours,
    daily.learning_hours,
    daily.bug_report_study_minutes,
    daily.focus_feeling,
  ];

  const completed =
    completionItems.filter(Boolean).length;

  const completionPercent =
    Math.round(
      (completed / completionItems.length) * 100
    );

  let performance = "Average";
  if (outputData.output > averageOutput * 1.5) {
    performance = "Exceptional";
  } else if (outputData.output > averageOutput * 1.2) {
    performance = "Above Average";
  } else if (outputData.output < averageOutput * 0.7) {
    performance = "Below Average";
  }

  // Visual helper for badge styling based on performance tier
  const getPerformanceColor = (status: string) => {
    if (status === "Exceptional" || status === "Above Average" || status === "Good" || status === "Excellent") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (status === "Below Average" || status === "Poor") return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

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

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 shadow-lg backdrop-blur-md flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Today's Completion
            </h2>
            <div className="text-4xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-linear-to-r select-none from-cyan-400 to-blue-500 mt-1">
              {completionPercent}%
            </div>
          </div>
        </div>

        {summary && (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 shadow-xl backdrop-blur-md">

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Insight Summary
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Strongest correlations discovered so far.
                </p>
              </div>

              <Link
                href="/insights"
                className="text-sm text-cyan-400 hover:text-cyan-300"
              >
                View Full Insights →
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-4">

              <div className="bg-slate-950/40 border border-emerald-500/20 rounded-xl p-4">
                <div className="text-xs uppercase tracking-wider text-emerald-400 mb-2">
                  Best Habit
                </div>

                <div className="text-lg font-bold text-slate-200">
                  {summary.bestHabit}
                </div>

                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-slate-500">
                    Impact
                  </span>

                  <span className="font-bold text-emerald-400">
                    +{summary.bestImpact}%
                  </span>
                </div>

                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-slate-500">
                    Confidence
                  </span>

                  <span className="text-slate-300">
                    {summary.bestConfidence}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/40 border border-rose-500/20 rounded-xl p-4">
                <div className="text-xs uppercase tracking-wider text-rose-400 mb-2">
                  Biggest Negative
                </div>

                <div className="text-lg font-bold text-slate-200">
                  {summary.worstHabit}
                </div>

                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-slate-500">
                    Impact
                  </span>

                  <span className="font-bold text-rose-400">
                    {summary.worstImpact}%
                  </span>
                </div>

                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-slate-500">
                    Confidence
                  </span>

                  <span className="text-slate-300">
                    {summary.worstConfidence}
                  </span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Row 1: High Level Metrics Overviews */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Today's Output Overview */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Today's Output</h2>
                <span className={`text-xs px-2.5 py-1 rounded-full border ${getPerformanceColor(performance)} font-medium`}>
                  {performance}
                </span>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                  <span>Recon Sessions</span>
                  <span className="font-mono font-medium">{outputData.recon}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                  <span>Targets Tested</span>
                  <span className="font-mono font-medium">{outputData.targets}</span>
                </div>
                <div className="flex justify-between pb-1.5">
                  <span>Findings Logged</span>
                  <span className="font-mono font-medium text-amber-400">{outputData.findings}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Score / Avg ({averageOutput.toFixed(1)})</span>
              <div className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-linear-to-r select-none from-cyan-400 to-blue-500">
                {outputData.output}
              </div>
            </div>
          </div>

          {/* Daily Analysis Summary */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Daily Analysis</h2>
                <span className={`text-xs px-2.5 py-1 rounded-full border ${getPerformanceColor(remark.remark)} font-medium`}>
                  {remark.remark}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated evaluation of performance trends mapped against metrics thresholds.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Remark Score</span>
              <div className="text-3xl font-black tracking-tight text-slate-200">
                {remark.score}
              </div>
            </div>
          </div>

          {/* Aggregated Aggressors (Today's Direct Stats Counter) */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Activity Accumulator</h2>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/60">
                  <div className="text-xs text-slate-500 mb-0.5">Recon</div>
                  <div className="text-lg font-bold font-mono text-slate-200">{stats.recon_session || 0}</div>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/60">
                  <div className="text-xs text-slate-500 mb-0.5">Targets</div>
                  <div className="text-lg font-bold font-mono text-slate-200">{stats.target_tested || 0}</div>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/60">
                  <div className="text-xs text-slate-500 mb-0.5">Findings</div>
                  <div className="text-lg font-bold font-mono text-amber-500">{stats.finding || 0}</div>
                </div>
              </div>
            </div>
          </div>

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
            <h2 className="text-lg font-bold text-slate-200 mb-1">Daily Telemetry Inputs</h2>
            <p className="text-xs text-slate-400 mb-4">Track biometric and environmental vectors influencing cognitive throughput.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Sleep Hours</label>
                <input
                  type="number"
                  placeholder="e.g. 7.5"
                  value={daily.sleep_hours}
                  onChange={(e) => setDaily({ ...daily, sleep_hours: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Wake Time</label>
                <input
                  type="time"
                  value={daily.wake_time}
                  onChange={(e) => setDaily({ ...daily, wake_time: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Reading Minutes (Before Bed)</label>
                <input
                  type="number"
                  placeholder="e.g. 30"
                  value={daily.reading_before_bed_minutes}
                  onChange={(e) => setDaily({ ...daily, reading_before_bed_minutes: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">No Screen Hours (Before Bed)</label>
                <input
                  type="number"
                  placeholder="e.g. 1"
                  value={daily.no_screen_hours}
                  onChange={(e) => setDaily({ ...daily, no_screen_hours: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Learning Hours</label>
                <input
                  type="number"
                  placeholder="e.g. 1"
                  value={daily.learning_hours}
                  onChange={(e) => setDaily({ ...daily, learning_hours: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Bug Report Study Minutes</label>
                <input
                  type="number"
                  placeholder="e.g. 1"
                  value={daily.bug_report_study_minutes}
                  onChange={(e) => setDaily({ ...daily, bug_report_study_minutes: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Focus Feeling</label>
                <select
                  value={daily.focus_feeling}
                  onChange={(e) => setDaily({ ...daily, focus_feeling: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                >
                  <option value="">Select Focus Level</option>
                  <option value="Distracted">Distracted</option>
                  <option value="Focused">Focused</option>
                  <option value="Deep">Deep</option>
                  <option value="Flow State">Flow State</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-400">Qualitative Log Notes</label>
                <textarea
                  value={daily.notes || ""}
                  onChange={(e) =>
                    setDaily({
                      ...daily,
                      notes: e.target.value,
                    })
                  }
                  placeholder="What external factors or anomalies affected throughput today?"
                  rows={3}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none"
                />
              </div>

            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between gap-4">
              <label className="flex items-center gap-2.5 text-sm select-none cursor-pointer text-slate-300 group">
                <input
                  type="checkbox"
                  checked={daily.workout}
                  onChange={(e) => setDaily({ ...daily, workout: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-cyan-500 accent-cyan-500 focus:ring-0 focus:ring-offset-0 transition-all"
                />
                <span className="group-hover:text-slate-100 transition-colors">Physical Workout Completed</span>
              </label>

              <button
                onClick={handleSave}
               className={`font-semibold px-5 py-2.5 rounded-lg text-sm transition-all shadow-md active:scale-[0.98] ${
    isSaved 
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
    </main>
  );
}