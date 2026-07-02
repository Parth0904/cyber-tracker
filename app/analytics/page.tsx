"use client";

import { useEffect, useState } from "react";

import SectionHeader from "@/app/components/common/SectionHeader";
import SummaryCard from "@/app/components/analytics/SummaryCard";
import TrendChartCard from "@/app/components/analytics/TrendChartCard";
import ActivityDistributionCard from "@/app/components/analytics/ActivityDistributionCard";
import HabitRankingCard from "@/app/components/analytics/HabitRankingCard";
import RecordsCard from "@/app/components/analytics/RecordsCard";
import MilestonesCard from "@/app/components/analytics/MilestonesCard";
import HeatmapCard from "@/app/components/analytics/HeatmapCard";

import {
  AnalyticsResponse,
  TimeRange,
} from "@/lib/types/analytics";

const ranges: TimeRange[] = [
  "week",
  "month",
  "year",
  "all",
];

export default function AnalyticsPage() {
  const [range, setRange] =
    useState<TimeRange>("all");

  const [analytics, setAnalytics] =
    useState<AnalyticsResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);

      const response = await fetch(
        `/api/analytics?range=${range}`
      );

      const data =
        await response.json();

      setAnalytics(data);

      setLoading(false);
    }

    loadAnalytics();
  }, [range]);

  if (loading || !analytics) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-slate-400">
          Loading analytics...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">

      <div className="max-w-7xl mx-auto px-6 py-10">

        <SectionHeader
          title="Analytics"
        />

        {/* Range Selector */}

        <div className="flex gap-3 mb-8 flex-wrap">

          {ranges.map((item) => (

            <button
              key={item}
              onClick={() =>
                setRange(item)
              }
              className={`px-4 py-2 rounded-lg transition ${
                range === item
                  ? "bg-cyan-500 text-slate-950"
                  : "bg-slate-900 border border-slate-800 hover:border-cyan-500"
              }`}
            >
              {item.toUpperCase()}
            </button>

          ))}

        </div>

        {/* Summary */}

        <SummaryCard
          summary={analytics.summary}
        />

        <div className="grid lg:grid-cols-2 gap-6 mt-6">

          <TrendChartCard
            trend={
              analytics.scoreTrend
            }
          />

          <ActivityDistributionCard
            distribution={
              analytics.activityDistribution
            }
          />

          <HabitRankingCard
            habits={
              analytics.habitRanking
            }
          />

          <RecordsCard
            records={
              analytics.personalRecords
            }
          />

          <MilestonesCard
            milestones={
              analytics.milestones
            }
          />

          <HeatmapCard
            heatmap={
              analytics.heatmap
            }
          />

        </div>

      </div>

    </main>
  );
}