"use client";

import { useEffect, useMemo, useState } from "react";

import SectionHeader from "@/app/components/common/SectionHeader";

import HistorySummary from "@/app/components/history/HistorySummary";
import HistoryFilters from "@/app/components/history/HistoryFilters";
import HistorySearch from "@/app/components/history/HistorySearch";
import HistoryTimeline from "@/app/components/history/HistoryTimeline";
import HistoryCard from "@/app/components/history/HistoryCard";

import {
  HistoryDay,
  HistorySummary as HistorySummaryType,
} from "@/lib/history/";

export default function HistoryPage() {
  const [history, setHistory] = useState<
    HistoryDay[]
  >([]);

  const [summary, setSummary] =
    useState<HistorySummaryType | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("all");

  useEffect(() => {
    async function load() {
      setLoading(true);

      const [historyRes, summaryRes] =
        await Promise.all([
          fetch("/api/history"),
          fetch("/api/history/summary"),
        ]);

      setHistory(
        await historyRes.json()
      );

      setSummary(
        await summaryRes.json()
      );

      setLoading(false);
    }

    load();
  }, []);

  const filteredHistory =
    useMemo(() => {

      let data = [...history];

      if (filter !== "all") {

        const now = new Date();

        const days =
          filter === "week"
            ? 7
            : filter === "month"
            ? 30
            : 365;

        data = data.filter((day) => {

          const diff =
            (now.getTime() -
              new Date(
                day.date
              ).getTime()) /
            86400000;

          return diff <= days;
        });

      }

      if (search.trim()) {

        const value =
          search.toLowerCase();

        data = data.filter((day) =>

          day.date
            .toLowerCase()
            .includes(value) ||

          day.daily.notes
            ?.toLowerCase()
            .includes(value)

        );

      }

      return data;

    }, [history, search, filter]);

  if (loading || !summary) {

    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading history...
      </main>
    );

  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">

      <div className="max-w-7xl mx-auto px-6 py-10">

        <SectionHeader
          title="History"
          subtitle="Review your past performance, habits and productivity."
        />

        <HistorySummary
          trackedDays={
            summary.totalDays
          }
          averageScore={
            summary.averageScore
          }
          bestScore={
            summary.highestScore
          }
        />

        <div className="mt-8 flex flex-col gap-4">

          <HistorySearch
            value={search}
            onChange={setSearch}
          />

          <HistoryFilters
            value={filter}
            onChange={setFilter}
          />

        </div>

        <div className="mt-8">

          <HistoryTimeline>

            {filteredHistory.length ===
            0 ? (

              <div className="text-center py-12 text-slate-500">

                No history found.

              </div>

            ) : (

              filteredHistory.map(
                (day) => (

                  <HistoryCard
                    key={day.date}
                    day={day}
                  />

                )
              )

            )}

          </HistoryTimeline>

        </div>

      </div>

    </main>
  );
}