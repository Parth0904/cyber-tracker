"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import InsightCard from "../components/insights/InsightCard";
import { DashboardData } from "@/lib/types/dashboard";

export default function InsightsPage() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setDashboard);
  }, []);

  if (!dashboard) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">
          Loading insights...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">

      {/* Header */}

      <header className="border-b border-slate-800 bg-slate-900/50 sticky top-0 z-50 backdrop-blur">

        <div className="max-w-6xl mx-auto h-16 px-6 flex items-center justify-between">

          <div className="flex items-center gap-2">

            <div className="w-3 h-3 rounded-full bg-cyan-500" />

            <span className="font-bold tracking-wider uppercase text-sm">
              Cyber Tracker
            </span>

          </div>

          <nav className="flex gap-2 text-sm">

            <Link
              href="/"
              className="px-4 py-2 rounded hover:bg-slate-800"
            >
              Dashboard
            </Link>

            <Link
              href="/history"
              className="px-4 py-2 rounded hover:bg-slate-800"
            >
              History
            </Link>

            <Link
              href="/analytics"
              className="px-4 py-2 rounded hover:bg-slate-800"
            >
              Analytics
            </Link>

            <Link
              href="/insights"
              className="px-4 py-2 rounded bg-slate-800 text-cyan-400"
            >
              Insights
            </Link>

          </nav>

        </div>

      </header>

      <div className="max-w-5xl mx-auto py-10 px-6">

        <div className="mb-10">

          <h1 className="text-4xl font-black">
            Performance Insights
          </h1>

          <p className="text-slate-400 mt-3 max-w-2xl">
            Personalized recommendations generated from your own
            productivity history. These insights become more
            accurate as more data is collected.
          </p>

        </div>

        {/* Highest Priority */}

        <div className="mb-8">

          <div className="text-xs uppercase tracking-[0.3em] text-cyan-400 mb-4">
            Highest Priority
          </div>

          <InsightCard
            {...dashboard.focus}
          />

        </div>

        {/* Remaining */}

        <div>

          <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-4">
            Other Recommendations
          </div>

          <div className="grid gap-6">

            {dashboard.insights
              .slice(1)
              .map((insight) => (

                <InsightCard
                  key={insight.habit}
                  {...insight}
                />

              ))}

          </div>

        </div>

      </div>

    </main>
  );
}