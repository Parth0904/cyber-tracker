"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { MonthlyReport } from "@/lib/services/reporting/monthlyReport";

export default function MonthlyReviewPage() {
  const params = useParams();
  const yearStr = params?.year as string;
  const monthStr = params?.month as string;
  const yearNum = Number(yearStr) || new Date().getFullYear();
  const monthNum = Number(monthStr) || new Date().getMonth() + 1;

  const [report, setReport] = React.useState<MonthlyReport | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadMonthlyReport() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reviews/${yearNum}/month/${monthNum}`);
        if (res.ok) {
          const json = await res.json();
          setReport(json);
        }
      } catch (err) {
        console.error("Failed to load monthly report:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMonthlyReport();
  }, [yearNum, monthNum]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 font-mono text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
          <span>Compiling Monthly Review for {monthNum}/{yearNum}...</span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <EmptyState
          title={`No Monthly Report Found for ${monthNum}/${yearNum}`}
          description="Could not compile monthly report data for this period."
          action={
            <Link
              href="/reviews"
              className="text-xs text-accent-cyan hover:underline font-mono"
            >
              Back to Reviews
            </Link>
          }
        />
      </div>
    );
  }

  const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
  const prevYear = monthNum === 1 ? yearNum - 1 : yearNum;
  const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
  const nextYear = monthNum === 12 ? yearNum + 1 : yearNum;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 font-mono text-xs">
      {/* HEADER & NAV */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/reviews"
              className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ChevronLeft size={14} /> Reviews
            </Link>
            <span className="text-zinc-600">/</span>
            <Link
              href={`/reviews/${yearNum}`}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              {yearNum}
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-accent-cyan font-bold">{report.monthName}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-wider uppercase flex items-center gap-2">
            <Calendar size={18} className="text-accent-cyan" />
            Monthly Executive Review: {report.monthName} {report.year}
          </h1>
          <p className="text-zinc-400 text-xs">
            Period: {report.startDate} to {report.endDate} · {report.workdayCount} Workdays
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/reviews/${prevYear}/month/${prevMonth}`}
            className="flex items-center gap-1 bg-zinc-950 border border-border-subtle px-3 py-1.5 rounded text-zinc-300 hover:text-white transition-colors"
          >
            <ChevronLeft size={12} /> Prev Month
          </Link>
          <Link
            href={`/reviews/${nextYear}/month/${nextMonth}`}
            className="flex items-center gap-1 bg-zinc-950 border border-border-subtle px-3 py-1.5 rounded text-zinc-300 hover:text-white transition-colors"
          >
            Next Month <ChevronRight size={12} />
          </Link>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-black/40 border border-border-subtle rounded-xl p-4 space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase block font-bold">Monthly Target</span>
          <div className="text-2xl font-bold text-white">{report.monthlyTargetHours}h</div>
          <span className="text-[10px] text-zinc-400">{report.workdayCount} Workdays × 8h</span>
        </div>

        <div className="bg-black/40 border border-border-subtle rounded-xl p-4 space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase block font-bold">Productive Hours</span>
          <div className="text-2xl font-bold text-accent-cyan">{report.totalProductiveHours}h</div>
          <span className="text-[10px] text-zinc-400">
            {report.totalLearningHours}h Learn + {report.totalHuntingHours}h Hunt
          </span>
        </div>

        <div className="bg-black/40 border border-border-subtle rounded-xl p-4 space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase block font-bold">Completion Rate</span>
          <div className="text-2xl font-bold text-white">{report.completionPercentage}%</div>
          <span
            className={`text-[10px] font-bold ${
              report.surplusDeficitHours >= 0 ? "text-success-emerald" : "text-danger-rose"
            }`}
          >
            {report.surplusDeficitHours >= 0 ? `+${report.surplusDeficitHours}h Surplus` : `${report.surplusDeficitHours}h Deficit`}
          </span>
        </div>

        <div className="bg-black/40 border border-border-subtle rounded-xl p-4 space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase block font-bold">Workday Average</span>
          <div className="text-2xl font-bold text-white">{report.monthlyAverageWorkdayHours}h/day</div>
          <span className="text-[10px] text-zinc-400">Target: 8.0h/workday</span>
        </div>
      </div>

      {/* NOTABLE PERFORMANCE CHANGES & RECOVERY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-950/40 border border-border-subtle rounded-xl p-4 space-y-2">
          <span className="text-[10px] text-zinc-500 uppercase block font-bold flex items-center gap-1.5">
            <Sparkles size={13} className="text-accent-cyan" /> Notable Performance Changes
          </span>
          <div className="space-y-1.5">
            {report.notableChanges.map((change, i) => (
              <div key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                <span className="text-accent-cyan">•</span>
                <span>{change}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-950/40 border border-border-subtle rounded-xl p-4 space-y-2">
          <span className="text-[10px] text-zinc-500 uppercase block font-bold flex items-center gap-1.5">
            <Shield size={13} className="text-accent-cyan" /> Recovery Patterns
          </span>
          <div className="text-xs text-zinc-300 space-y-1">
            <div>• <strong className="text-white">{report.recoveryDaysCount}</strong> recovery workdays triggered across weeks.</div>
            <div>• <strong className="text-white">{report.weekendDaysConsumed}</strong> weekend days consumed for work/recovery.</div>
            <div>• <strong className="text-white">{report.daysReaching8hCount}</strong> days achieved the 8.0h daily ideal target.</div>
          </div>
        </div>
      </div>

      {/* WEEKLY BUILDING BLOCKS TABLE */}
      <div className="border border-border-subtle bg-black/40 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <h2 className="text-white font-bold uppercase tracking-wider text-xs flex items-center gap-2">
            <Layers size={14} className="text-accent-cyan" /> Weekly Building Blocks ({report.monthName} {yearNum})
          </h2>
          <span className="text-[10px] text-zinc-500 uppercase font-bold">Completed Weekly Reports</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] uppercase text-zinc-500">
                <th className="pb-2">Week</th>
                <th className="pb-2">Dates</th>
                <th className="pb-2">Productive Hours</th>
                <th className="pb-2">Target</th>
                <th className="pb-2">Workday Avg</th>
                <th className="pb-2">Completion</th>
                <th className="pb-2">Recovery</th>
                <th className="pb-2 text-right">Drill-Down</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-mono">
              {report.weeklyReports.map((w) => (
                <tr key={w.weekNumber} className="hover:bg-zinc-950/50 transition-colors">
                  <td className="py-2.5 font-bold text-white">Week {w.weekNumber}</td>
                  <td className="py-2.5 text-zinc-400">{w.startDate} → {w.endDate}</td>
                  <td className="py-2.5 font-bold text-accent-cyan">{w.productiveHours}h</td>
                  <td className="py-2.5 text-zinc-400">{w.targetHours}h</td>
                  <td className="py-2.5 text-white">{w.workdayAverage}h/day</td>
                  <td className="py-2.5">
                    <span
                      className={`font-bold ${
                        w.completionPercentage >= 100
                          ? "text-success-emerald"
                          : w.completionPercentage >= 75
                          ? "text-warning-amber"
                          : "text-danger-rose"
                      }`}
                    >
                      {w.completionPercentage}%
                    </span>
                  </td>
                  <td className="py-2.5">
                    {w.recoveryRequired ? (
                      <span className="text-warning-amber font-bold text-[10px]">
                        Recovery ({w.weekendRecoveryDaysCount}d)
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-[10px]">None</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    <Link
                      href={`/reviews/${yearNum}/${w.weekNumber}`}
                      className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-accent-cyan hover:underline"
                    >
                      View Week <ChevronRight size={10} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CYBERSECURITY OUTPUT SUMMARY */}
      <div className="border border-border-subtle bg-black/40 rounded-xl p-5 space-y-4">
        <h2 className="text-white font-bold uppercase tracking-wider text-xs flex items-center gap-2 border-b border-border-subtle pb-3">
          <Shield size={14} className="text-accent-cyan" /> Monthly Cybersecurity Output
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-zinc-950/60 border border-zinc-900 p-3 rounded-lg">
            <span className="text-[10px] text-zinc-500 uppercase block font-bold">Recon Hours</span>
            <div className="text-lg font-bold text-white">{report.cybersecuritySummary.reconHours}h</div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-900 p-3 rounded-lg">
            <span className="text-[10px] text-zinc-500 uppercase block font-bold">Targets Worked</span>
            <div className="text-lg font-bold text-white">{report.cybersecuritySummary.targetsWorkedCount}</div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-900 p-3 rounded-lg">
            <span className="text-[10px] text-zinc-500 uppercase block font-bold">Reports Submitted</span>
            <div className="text-lg font-bold text-white">{report.cybersecuritySummary.reportsSubmitted}</div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-900 p-3 rounded-lg">
            <span className="text-[10px] text-zinc-500 uppercase block font-bold">Valid Reports</span>
            <div className="text-lg font-bold text-success-emerald">{report.cybersecuritySummary.validReports}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
