"use client";

import * as React from "react";
import Link from "next/link";
import { 
  FileText, ChevronRight, RefreshCw, Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type WeeklyReviewMetadata = {
  year: number;
  week: number;
  startDate: string;
  endDate: string;
  generated: boolean;
  created_at?: string;
  consistencyScore?: number;
  consistencyState?: "green" | "amber" | "red";
  huntingHours?: number;
  learningHours?: number;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function ReviewsDashboard() {
  const currentYear = new Date().getFullYear();
  const [activeTab, setActiveTab] = React.useState<"weekly" | "monthly" | "yearly">("weekly");
  const [reviews, setReviews] = React.useState<WeeklyReviewMetadata[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error("Failed loading reviews index:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchReviews();
  }, []);

  const handleGenerate = async (year: number, week: number) => {
    const key = `${year}-${week}`;
    setGenerating(key);
    try {
      const res = await fetch(`/api/reviews/${year}/${week}`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchReviews();
      }
    } catch (err) {
      console.error("Failed compiling review:", err);
    } finally {
      setGenerating(null);
    }
  };

  const renderConsistencyBadge = (state?: "green" | "amber" | "red", score?: number) => {
    if (state === undefined || score === undefined) {
      return (
        <Badge variant="neutral" className="text-[9px] py-0.5 px-1.5 uppercase font-mono font-bold tracking-wider">
          UNCOMPILED
        </Badge>
      );
    }
    let variant: "success" | "warning" | "danger" = "danger";
    if (state === "green") variant = "success";
    if (state === "amber") variant = "warning";
    return (
      <Badge variant={variant as any} className="text-[9px] py-0.5 px-1.5 font-mono font-bold tracking-wider uppercase">
        {state} ({score}%)
      </Badge>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-zinc-200 font-mono text-xs">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle/80 pb-5">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white uppercase flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent-cyan" /> Historical Reporting Hierarchy
          </h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">// Weekly → Monthly → Yearly canonical performance review registry.</p>
        </div>

        {/* HIERARCHICAL TABS */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-border-subtle">
          <button
            onClick={() => setActiveTab("weekly")}
            className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors ${
              activeTab === "weekly"
                ? "bg-accent-cyan text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setActiveTab("monthly")}
            className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors ${
              activeTab === "monthly"
                ? "bg-accent-cyan text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setActiveTab("yearly")}
            className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors ${
              activeTab === "yearly"
                ? "bg-accent-cyan text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* WEEKLY REPORTS TAB */}
      {activeTab === "weekly" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">
              Showing active and historical weekly review reports (40h standard).
            </span>
            <Button
              variant="secondary"
              onClick={fetchReviews}
              className="h-7 text-[10px] gap-1.5"
            >
              <RefreshCw size={11} /> Refresh
            </Button>
          </div>

          {loading ? (
            <div className="text-zinc-500 italic py-8 text-center">Loading weekly reports...</div>
          ) : reviews.length === 0 ? (
            <div className="text-zinc-500 italic py-8 text-center">No weekly reviews recorded.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {reviews.map((rev) => {
                const isGenerating = generating === `${rev.year}-${rev.week}`;
                const totalHours = ((rev.huntingHours || 0) + (rev.learningHours || 0)).toFixed(1);

                return (
                  <div
                    key={`${rev.year}-${rev.week}`}
                    className="border border-border-subtle bg-black/40 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white uppercase text-xs">
                          {rev.year} · Week {rev.week}
                        </span>
                        {renderConsistencyBadge(rev.consistencyState, rev.consistencyScore)}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {rev.startDate} → {rev.endDate}
                      </div>

                      {rev.generated ? (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900 text-[10px]">
                          <div>
                            <span className="text-zinc-500 block">Total Work</span>
                            <span className="text-accent-cyan font-bold">{totalHours}h / 40h</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block">Hunting / Learn</span>
                            <span className="text-white">
                              {(rev.huntingHours || 0).toFixed(1)}h / {(rev.learningHours || 0).toFixed(1)}h
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-zinc-500 italic pt-2">
                          Not compiled yet. Click below to generate report.
                        </div>
                      )}
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-zinc-900 mt-3">
                      {rev.generated ? (
                        <Link
                          href={`/reviews/${rev.year}/${rev.week}`}
                          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-accent-cyan hover:underline"
                        >
                          View Report <ChevronRight size={12} />
                        </Link>
                      ) : (
                        <span className="text-[10px] text-zinc-500">Uncompiled</span>
                      )}

                      <Button
                        variant="secondary"
                        disabled={isGenerating}
                        onClick={() => handleGenerate(rev.year, rev.week)}
                        className="h-6 text-[9px] uppercase font-bold"
                      >
                        {isGenerating ? "Compiling..." : rev.generated ? "Recompile" : "Compile"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MONTHLY REPORTS TAB */}
      {activeTab === "monthly" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">
              Aggregated monthly reports for {currentYear} built from completed weekly reviews.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {MONTH_NAMES.map((name, idx) => {
              const monthNum = idx + 1;
              return (
                <Link
                  key={name}
                  href={`/reviews/${currentYear}/month/${monthNum}`}
                  className="border border-border-subtle bg-black/40 rounded-xl p-4 space-y-2 hover:border-accent-cyan transition-colors block group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs group-hover:text-accent-cyan transition-colors">
                      {name}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">
                      M{String(monthNum).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Monthly Report {monthNum}/{currentYear}
                  </div>
                  <div className="flex items-center justify-end text-[10px] font-bold text-accent-cyan pt-2">
                    Open Monthly Report <ChevronRight size={12} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* YEARLY REPORTS TAB */}
      {activeTab === "yearly" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">
              Yearly executive performance reviews aggregating 12 monthly cycles.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[currentYear, currentYear - 1].map((year) => (
              <Link
                key={year}
                href={`/reviews/${year}`}
                className="border border-border-subtle bg-black/40 rounded-xl p-5 space-y-3 hover:border-accent-cyan transition-colors block group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-accent-cyan" />
                    <span className="font-bold text-white text-base group-hover:text-accent-cyan transition-colors">
                      Year {year}
                    </span>
                  </div>
                  <Badge variant="neutral" className="text-[9px] uppercase font-bold">
                    Executive
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Full 12-month aggregation of workdays, productive hours, strongest/weakest months, and recovery patterns.
                </p>
                <div className="flex items-center justify-end text-[10px] font-bold text-accent-cyan pt-2">
                  View Full Year Review <ChevronRight size={12} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
