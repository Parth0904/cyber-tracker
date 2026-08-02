"use client";

import * as React from "react";
import Link from "next/link";
import { 
  FileText, Plus, ChevronRight, RefreshCw 
} from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

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

export default function ReviewsDashboard() {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
        // RETRIEVING_INTELLIGENCE_METADATA...
      </div>
    );
  }

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
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 text-zinc-200">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle/80 pb-5">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white uppercase font-mono flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent-cyan" /> Weekly Review Registry
          </h1>
          <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">// Objective data-driven performance reviews and target analytics.</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="max-w-4xl mx-auto py-12">
          <EmptyState 
            title="Registry Empty" 
            description="No trackable weekly records or daily entries were found. Begin logging target sessions or habit logs to enable review compilation."
          />
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* ACTIVE & UNCOMPILED WEEKS PANELS */}
          <div className="grid grid-cols-1 gap-4">
            <h2 className="text-[10px] font-mono font-bold tracking-wider text-zinc-400 uppercase">TELEMETRY TIMELINE</h2>
            
            <div className="border border-border-subtle rounded-xl overflow-hidden bg-black/40 backdrop-blur">
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle bg-zinc-950/80 text-zinc-500 text-[10px]">
                      <th className="p-4 uppercase font-bold tracking-wider">Review Week</th>
                      <th className="p-4 uppercase font-bold tracking-wider">Date Range</th>
                      <th className="p-4 uppercase font-bold tracking-wider">Consistency Status</th>
                      <th className="p-4 uppercase font-bold tracking-wider">Hunting Time</th>
                      <th className="p-4 uppercase font-bold tracking-wider">Learning Time</th>
                      <th className="p-4 uppercase font-bold tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((r) => {
                      const key = `${r.year}-${r.week}`;
                      const isGenerating = generating === key;
                      
                      return (
                        <tr key={key} className="border-b border-border-subtle/40 hover:bg-zinc-900/20 transition-colors">
                          <td className="p-4 font-bold text-white">
                            Week {r.week} <span className="text-[9px] text-zinc-500 font-normal ml-1">({r.year})</span>
                          </td>
                          <td className="p-4 text-zinc-400">{r.startDate} to {r.endDate}</td>
                          <td className="p-4">
                            {renderConsistencyBadge(r.consistencyState, r.consistencyScore)}
                          </td>
                          <td className="p-4 text-zinc-300">
                            {r.generated ? `${r.huntingHours?.toFixed(1)}h` : "—"}
                          </td>
                          <td className="p-4 text-zinc-300">
                            {r.generated ? `${r.learningHours?.toFixed(1)}h` : "—"}
                          </td>
                          <td className="p-4 text-right">
                            {r.generated ? (
                              <Link
                                href={`/reviews/${r.year}/${r.week}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-border-subtle text-accent-cyan rounded font-bold transition-all"
                              >
                                View Report <ChevronRight size={10} />
                              </Link>
                            ) : (
                              <button
                                onClick={() => handleGenerate(r.year, r.week)}
                                disabled={isGenerating}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/20 text-accent-cyan rounded font-bold transition-all disabled:opacity-50"
                              >
                                {isGenerating ? (
                                  <>
                                    <RefreshCw size={10} className="animate-spin" /> Compiling...
                                  </>
                                ) : (
                                  <>
                                    <Plus size={10} /> Compile Review
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
