"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Award,
  Shield,
  Activity,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { YearlyReport } from "@/lib/services/reporting/yearlyReport";

export default function YearlyReviewPage() {
  const params = useParams();
  const yearStr = params?.year as string;
  const yearNum = Number(yearStr) || new Date().getFullYear();

  const [report, setReport] = React.useState<YearlyReport | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadYearlyReport() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reviews/${yearNum}`);
        if (res.ok) {
          const json = await res.json();
          setReport(json);
        }
      } catch (err) {
        console.error("Failed to load yearly report:", err);
      } finally {
        setLoading(false);
      }
    }
    loadYearlyReport();
  }, [yearNum]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 font-mono text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
          <span>Compiling Yearly Review for {yearNum}...</span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <EmptyState
          title={`No Yearly Report Found for ${yearNum}`}
          description="Could not compile yearly report data for this period."
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
            <span className="text-accent-cyan font-bold">Year {report.year}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-wider uppercase flex items-center gap-2">
            <Calendar size={18} className="text-accent-cyan" />
            Yearly Executive Performance Review {report.year}
          </h1>
          <p className="text-zinc-400 text-xs">{report.progressionSummary}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/reviews/${yearNum - 1}`}
            className="flex items-center gap-1 bg-zinc-950 border border-border-subtle px-3 py-1.5 rounded text-zinc-300 hover:text-white transition-colors"
          >
            <ChevronLeft size={12} /> {yearNum - 1}
          </Link>
          <Link
            href={`/reviews/${yearNum + 1}`}
            className="flex items-center gap-1 bg-zinc-950 border border-border-subtle px-3 py-1.5 rounded text-zinc-300 hover:text-white transition-colors"
          >
            {yearNum + 1} <ChevronRight size={12} />
          </Link>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-black/40 border border-border-subtle rounded-xl p-4 space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase block font-bold">Yearly Target</span>
          <div className="text-2xl font-bold text-white">{report.yearlyTargetHours}h</div>
          <span className="text-[10px] text-zinc-400">{report.totalWorkdays} Workdays × 8h</span>
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
          <div className="text-2xl font-bold text-white">{report.targetCompletionPercentage}%</div>
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
          <div className="text-2xl font-bold text-white">{report.averageWorkdayHours}h/day</div>
          <span className="text-[10px] text-zinc-400">Target: 8.0h/workday</span>
        </div>
      </div>

      {/* HIGHLIGHTS: STRONGEST / WEAKEST / RECOVERY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-950/40 border border-border-subtle rounded-xl p-4 space-y-2">
          <span className="text-[10px] text-zinc-500 uppercase block font-bold flex items-center gap-1.5">
            <Award size={13} className="text-accent-cyan" /> Strongest Month
          </span>
          {report.strongestMonth ? (
            <div>
              <Link
                href={`/reviews/${yearNum}/month/${report.strongestMonth.month}`}
                className="text-sm font-bold text-white hover:text-accent-cyan transition-colors"
              >
                {report.strongestMonth.monthName}
              </Link>
              <div className="text-zinc-400 text-xs mt-1">
                {report.strongestMonth.workdayAverage}h/workday ({report.strongestMonth.totalHours}h logged)
              </div>
            </div>
          ) : (
            <span className="text-zinc-500 italic">No active months</span>
          )}
        </div>

        <div className="bg-zinc-950/40 border border-border-subtle rounded-xl p-4 space-y-2">
          <span className="text-[10px] text-zinc-500 uppercase block font-bold flex items-center gap-1.5">
            <Activity size={13} className="text-warning-amber" /> Weakest Month
          </span>
          {report.weakestMonth ? (
            <div>
              <Link
                href={`/reviews/${yearNum}/month/${report.weakestMonth.month}`}
                className="text-sm font-bold text-white hover:text-accent-cyan transition-colors"
              >
                {report.weakestMonth.monthName}
              </Link>
              <div className="text-zinc-400 text-xs mt-1">
                {report.weakestMonth.workdayAverage}h/workday ({report.weakestMonth.totalHours}h logged)
              </div>
            </div>
          ) : (
            <span className="text-zinc-500 italic">No active months</span>
          )}
        </div>

        <div className="bg-zinc-950/40 border border-border-subtle rounded-xl p-4 space-y-2">
          <span className="text-[10px] text-zinc-500 uppercase block font-bold flex items-center gap-1.5">
            <Shield size={13} className="text-accent-cyan" /> Recovery Patterns
          </span>
          <div className="text-sm font-bold text-white">
            {report.totalWeekendDaysConsumed} Weekend Days Consumed
          </div>
          <div className="text-zinc-400 text-xs">
            {report.totalRecoveryDays} dynamic recovery periods triggered
          </div>
        </div>
      </div>

      {/* MONTHLY BREAKDOWN HIERARCHY TABLE */}
      <div className="border border-border-subtle bg-black/40 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <h2 className="text-white font-bold uppercase tracking-wider text-xs flex items-center gap-2">
            <Calendar size={14} className="text-accent-cyan" /> Monthly Building Blocks ({yearNum})
          </h2>
          <span className="text-[10px] text-zinc-500 uppercase font-bold">12 Calendar Months</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] uppercase text-zinc-500">
                <th className="pb-2">Month</th>
                <th className="pb-2">Workdays</th>
                <th className="pb-2">Target</th>
                <th className="pb-2">Productive Hours</th>
                <th className="pb-2">Workday Avg</th>
                <th className="pb-2">Completion</th>
                <th className="pb-2">Surplus / Deficit</th>
                <th className="pb-2 text-right">Drill-Down</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-mono">
              {report.monthlyReports.map((m) => (
                <tr key={m.month} className="hover:bg-zinc-950/50 transition-colors">
                  <td className="py-2.5 font-bold text-white">{m.monthName}</td>
                  <td className="py-2.5 text-zinc-400">{m.workdayCount}</td>
                  <td className="py-2.5 text-zinc-400">{m.targetHours}h</td>
                  <td className="py-2.5 font-bold text-accent-cyan">{m.totalProductiveHours}h</td>
                  <td className="py-2.5 text-white">{m.workdayAverage}h/day</td>
                  <td className="py-2.5">
                    <span
                      className={`font-bold ${
                        m.completionPercentage >= 100
                          ? "text-success-emerald"
                          : m.completionPercentage >= 75
                          ? "text-warning-amber"
                          : "text-danger-rose"
                      }`}
                    >
                      {m.completionPercentage}%
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span
                      className={
                        m.surplusDeficitHours >= 0 ? "text-success-emerald" : "text-danger-rose"
                      }
                    >
                      {m.surplusDeficitHours >= 0 ? `+${m.surplusDeficitHours}h` : `${m.surplusDeficitHours}h`}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <Link
                      href={`/reviews/${yearNum}/month/${m.month}`}
                      className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-accent-cyan hover:underline"
                    >
                      View Month <ChevronRight size={10} />
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
          <Shield size={14} className="text-accent-cyan" /> Yearly Cybersecurity Output
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-zinc-950/60 border border-zinc-900 p-3 rounded-lg">
            <span className="text-[10px] text-zinc-500 uppercase block font-bold">Recon Hours</span>
            <div className="text-lg font-bold text-white">{report.cybersecuritySummary.totalReconHours}h</div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-900 p-3 rounded-lg">
            <span className="text-[10px] text-zinc-500 uppercase block font-bold">Targets Worked</span>
            <div className="text-lg font-bold text-white">{report.cybersecuritySummary.totalTargetsWorkedCount}</div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-900 p-3 rounded-lg">
            <span className="text-[10px] text-zinc-500 uppercase block font-bold">Reports Submitted</span>
            <div className="text-lg font-bold text-white">{report.cybersecuritySummary.totalReportsSubmitted}</div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-900 p-3 rounded-lg">
            <span className="text-[10px] text-zinc-500 uppercase block font-bold">Valid Reports</span>
            <div className="text-lg font-bold text-success-emerald">{report.cybersecuritySummary.totalValidReports}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
