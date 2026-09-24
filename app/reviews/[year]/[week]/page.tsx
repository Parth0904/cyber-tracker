"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  FileText, ArrowLeft, RefreshCw, Download, Printer, 
  Target, BookOpen, Layers, FileJson, CheckCircle2, 
  TrendingUp, TrendingDown, Award, Lightbulb, Flame, CheckCircle
} from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { WeeklyReviewReport } from "@/lib/services/weeklyReview";

export default function WeeklyReviewPage() {
  const { year, week } = useParams() as { year: string; week: string };
  const [report, setReport] = React.useState<WeeklyReviewReport | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/reviews/${year}/${week}`);
        if (res.ok) {
          const data = await res.json();
          setReport(data.report);
        }
      } catch (err) {
        console.error("Failed loading weekly review:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [year, week]);

  const handleRegenerate = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/reviews/${year}/${week}`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch (err) {
      console.error("Failed regenerating report:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = (format: "json" | "markdown") => {
    window.open(`/api/reviews/${year}/${week}/export?format=${format}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
        // RETRIEVING_EXECUTIVE_INTELLIGENCE...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState 
          title="Executive Report Absent" 
          description="We couldn't compile or retrieve the personal weekly review report. Ensure target parameters are valid."
        />
      </div>
    );
  }

  const renderConfidenceBadge = (confidence: "High" | "Medium" | "Low") => {
    return (
      <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[8px] font-bold font-mono tracking-wide uppercase mt-1
        ${confidence === "High" ? "bg-accent-cyan/10 border-accent-cyan/25 text-accent-cyan" : 
          confidence === "Medium" ? "bg-warning-amber/10 border-warning-amber/25 text-warning-amber" : 
          "bg-zinc-800 border-zinc-700 text-zinc-400"}`}>
        CONFIDENCE: {confidence}
      </span>
    );
  };

  const formatPercent = (val: number, isScore = false) => {
    if (val === 0) return "0%";
    if (isScore) {
      return val > 0 ? `+${val}%` : `${val}%`;
    }
    return val > 0 ? `+${val}%` : `${val}%`;
  };

  const renderDeltaBadge = (val: number, isScore = false) => {
    if (val === 0) {
      return <span className="text-zinc-500 font-bold font-mono text-[10px]">Stable</span>;
    }
    return val > 0 ? (
      <span className="text-success-emerald font-bold font-mono text-[10px] inline-flex items-center gap-0.5">
        <TrendingUp size={10} /> {formatPercent(val, isScore)}
      </span>
    ) : (
      <span className="text-danger-rose font-bold font-mono text-[10px] inline-flex items-center gap-0.5">
        <TrendingDown size={10} /> {formatPercent(val, isScore)}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-zinc-200 print:text-black print:bg-white print:max-w-full print:p-0">
      
      {/* ACTION BAR & EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle/80 pb-5 print:border-b-2 print:border-black print:pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 print:hidden">
            <Link href="/reviews" className="text-zinc-500 hover:text-zinc-300 transition-colors font-mono text-[10px] uppercase flex items-center gap-1">
              <ArrowLeft size={10} /> Review timeline
            </Link>
          </div>
          <h1 className="text-sm font-semibold tracking-tight text-white print:text-black uppercase font-mono flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent-cyan print:hidden" /> Weekly Executive Review
          </h1>
          <p className="text-[11px] text-zinc-500 print:text-zinc-600 font-mono">
            // WEEK_{report.weekNumber} &bull; DATES: {report.startDate} TO {report.endDate} &bull; SYSTEM_MODEL: DETERMINISTIC
          </p>
        </div>

        {/* CONTROLS ROW */}
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            onClick={handleRegenerate}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-border-subtle hover:border-zinc-700 text-zinc-400 hover:text-white text-[10px] uppercase font-mono font-bold rounded transition-all disabled:opacity-50"
          >
            <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} /> {refreshing ? "Recalculating..." : "Regenerate"}
          </button>
          
          <button
            onClick={() => handleExport("markdown")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-border-subtle hover:border-zinc-700 text-zinc-400 hover:text-white text-[10px] uppercase font-mono font-bold rounded transition-all"
          >
            <Download size={11} /> Export MD
          </button>
          
          <button
            onClick={() => handleExport("json")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-border-subtle hover:border-zinc-700 text-zinc-400 hover:text-white text-[10px] uppercase font-mono font-bold rounded transition-all"
          >
            <FileJson size={11} /> Export JSON
          </button>
          
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-border-subtle hover:border-zinc-700 text-accent-cyan text-[10px] uppercase font-mono font-bold rounded transition-all"
          >
            <Printer size={11} /> Print PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
        
        {/* LEFT COLUMN: SECTIONS 1, 2, 3, 7 */}
        <div className="lg:col-span-2 space-y-6 print:col-span-2 print:space-y-4">
          
          {/* SECTION 1: EXECUTIVE SUMMARY */}
          <Panel className="space-y-4 print:border-2 print:border-black print:p-4">
            <div className="border-b border-border-subtle pb-3 flex justify-between items-center print:border-b-2 print:border-black">
              <h2 className="text-xs font-mono font-bold text-white print:text-black uppercase flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-cyan print:hidden" /> Section 1: Executive Summary
              </h2>
              <div>
                <span className="font-mono text-[10px] text-zinc-400 uppercase mr-2 print:text-black">Consistency:</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-[9px] uppercase border
                  ${report.executiveSummary.consistencyState === "green" ? "bg-success-emerald/10 border-success-emerald/25 text-success-emerald print:bg-white print:text-black" : 
                    report.executiveSummary.consistencyState === "amber" ? "bg-warning-amber/10 border-warning-amber/25 text-warning-amber print:bg-white print:text-black" : 
                    "bg-danger-rose/10 border-danger-rose/25 text-danger-rose print:bg-white print:text-black"}`}>
                  {report.executiveSummary.consistencyState} ({report.executiveSummary.consistencyScore}%)
                </span>
              </div>
            </div>

            <div className="space-y-3 font-mono text-[11px] leading-relaxed">
              <p className="text-white print:text-black font-semibold text-xs leading-relaxed border-l-2 border-accent-cyan pl-3">
                {report.executiveSummary.consistencyTrendText}
              </p>
              <p className="text-zinc-400 print:text-black leading-relaxed">
                {report.executiveSummary.summaryText}
              </p>
            </div>
          </Panel>

          {/* 5-DAY WORKWEEK CORE EXECUTION & RECOVERY PANEL */}
          {report.work && (
            <Panel className="space-y-4 print:border-2 print:border-black print:p-4">
              <div className="border-b border-border-subtle pb-3 flex justify-between items-center print:border-b-2 print:border-black">
                <h2 className="text-xs font-mono font-bold text-white print:text-black uppercase flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent-cyan print:hidden" /> 5-Day Workweek Execution & Recovery
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-[9px] uppercase border
                    ${report.performance?.classification === "GREEN" ? "bg-success-emerald/10 border-success-emerald/25 text-success-emerald" :
                      report.performance?.classification === "YELLOW" ? "bg-warning-amber/10 border-warning-amber/25 text-warning-amber" :
                      "bg-danger-rose/10 border-danger-rose/25 text-danger-rose"}`}>
                    {report.performance?.classification || "EVALUATED"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-zinc-400 print:text-black">
                <div className="bg-zinc-950/40 p-3 rounded border border-border-subtle/50">
                  <span className="text-[9px] uppercase text-zinc-500 block font-bold">Total Work / 40h</span>
                  <span className="text-white font-bold text-sm block mt-0.5">{report.work.totalProductiveHours}h</span>
                  <span className="text-[8px] text-zinc-500 block mt-1 uppercase">Target: 40.0h</span>
                </div>

                <div className="bg-zinc-950/40 p-3 rounded border border-border-subtle/50">
                  <span className="text-[9px] uppercase text-zinc-500 block font-bold">Workday Average</span>
                  <span className="text-white font-bold text-sm block mt-0.5">{report.work.averageWorkdayHours}h/day</span>
                  <span className="text-[8px] text-zinc-500 block mt-1 uppercase">Ideal: 8.0h/day</span>
                </div>

                <div className="bg-zinc-950/40 p-3 rounded border border-border-subtle/50">
                  <span className="text-[9px] uppercase text-zinc-500 block font-bold">Completion</span>
                  <span className="text-white font-bold text-sm block mt-0.5">{report.work.completionPercentage}%</span>
                  <span className={`text-[8px] font-bold block mt-1 uppercase ${report.work.surplusDeficitHours >= 0 ? "text-success-emerald" : "text-danger-rose"}`}>
                    {report.work.surplusDeficitHours >= 0 ? `+${report.work.surplusDeficitHours}h Surplus` : `${report.work.surplusDeficitHours}h Deficit`}
                  </span>
                </div>

                <div className="bg-zinc-950/40 p-3 rounded border border-border-subtle/50">
                  <span className="text-[9px] uppercase text-zinc-500 block font-bold">Recovery Status</span>
                  <span className="text-white font-bold text-sm block mt-0.5">
                    {report.recovery?.recoveryRequired ? "Required" : "Normal"}
                  </span>
                  <span className="text-[8px] text-zinc-500 block mt-1 uppercase">
                    Sat: {report.recovery?.saturdayRecoveryStatus === "RECOVERY_WORKDAY" ? "Workday" : "Holiday"}
                  </span>
                </div>
              </div>

              {/* DAILY PERFORMANCE DISTRIBUTION */}
              {report.performance?.dailyDistribution && (
                <div className="pt-2">
                  <span className="text-[9px] uppercase text-zinc-500 block font-bold mb-2">Daily Performance Distribution (Mon–Sun)</span>
                  <div className="grid grid-cols-7 gap-1.5 text-center text-[10px]">
                    {report.performance.dailyDistribution.map((d) => (
                      <div
                        key={d.date}
                        className={`p-2 rounded border ${
                          d.metTarget
                            ? "bg-accent-cyan/10 border-accent-cyan/30 text-white"
                            : d.isWeekend
                            ? "bg-zinc-950/30 border-zinc-900 text-zinc-500"
                            : "bg-zinc-950/60 border-zinc-800 text-zinc-400"
                        }`}
                      >
                        <span className="text-[8px] uppercase block text-zinc-500">{d.dayOfWeek.slice(0, 3)}</span>
                        <span className="font-bold block mt-0.5">{d.productiveHours}h</span>
                        <span className={`text-[7px] uppercase font-bold block mt-0.5 ${d.metTarget ? "text-accent-cyan" : "text-zinc-600"}`}>
                          {d.metTarget ? "8h+ ✅" : d.isWeekend ? "Rest" : "<8h"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          )}

          {/* SECTION 2: WORK SUMMARY */}
          <Panel className="space-y-4 print:border-2 print:border-black print:p-4">
            <div className="border-b border-border-subtle pb-3 print:border-b-2 print:border-black">
              <h2 className="text-xs font-mono font-bold text-white print:text-black uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent-cyan print:hidden" /> Section 2: Work Summary
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-zinc-400 print:text-black">
              <div className="bg-zinc-950/40 p-3 rounded border border-border-subtle/50 print:bg-white print:border-black">
                <span className="text-[9px] uppercase text-zinc-500 block font-bold">Hunting Time</span>
                <span className="text-white print:text-black font-bold text-sm block mt-0.5">{report.workSummary.totalHuntingHours.toFixed(1)}h</span>
                <span className="text-[8px] text-zinc-600 block mt-1 uppercase truncate">Targets: {report.workSummary.targetsCount}</span>
              </div>

              <div className="bg-zinc-950/40 p-3 rounded border border-border-subtle/50 print:bg-white print:border-black">
                <span className="text-[9px] uppercase text-zinc-500 block font-bold">Learning Time</span>
                <span className="text-white print:text-black font-bold text-sm block mt-0.5">{report.workSummary.totalLearningHours.toFixed(1)}h</span>
                <span className="text-[8px] text-zinc-600 block mt-1 uppercase truncate">Topics: {report.workSummary.topicsCount}</span>
              </div>

              <div className="bg-zinc-950/40 p-3 rounded border border-border-subtle/50 print:bg-white print:border-black">
                <span className="text-[9px] uppercase text-zinc-500 block font-bold">Reports Submitted</span>
                <span className="text-white print:text-black font-bold text-sm block mt-0.5">{report.workSummary.reportsSubmitted}</span>
                <span className="text-[8px] text-zinc-600 block mt-1 uppercase">Valid findings: {report.workSummary.validReports}</span>
              </div>

              <div className="bg-zinc-950/40 p-3 rounded border border-border-subtle/50 print:bg-white print:border-black">
                <span className="text-[9px] uppercase text-zinc-500 block font-bold">Total Sessions</span>
                <span className="text-white print:text-black font-bold text-sm block mt-0.5">{report.workSummary.totalSessions}</span>
                <span className="text-[8px] text-zinc-600 block mt-1 uppercase">HUNT & LEARN</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-[10px] mt-2">
              <div className="bg-zinc-950/50 p-2.5 rounded border border-border-subtle/30 print:bg-white print:border-black">
                <span className="text-zinc-500 font-bold uppercase block mb-1">Targets Worked:</span>
                <span className="text-zinc-300 print:text-black">{report.workSummary.targetsWorkedOn.join(", ") || "None"}</span>
              </div>
              <div className="bg-zinc-950/50 p-2.5 rounded border border-border-subtle/30 print:bg-white print:border-black">
                <span className="text-zinc-500 font-bold uppercase block mb-1">Topics Studied:</span>
                <span className="text-zinc-300 print:text-black">{report.workSummary.topicsStudied.join(", ") || "None"}</span>
              </div>
            </div>
          </Panel>

          {/* SECTION 3: COMPARISON */}
          <Panel className="space-y-4 print:border-2 print:border-black print:p-4">
            <div className="border-b border-border-subtle pb-3 print:border-b-2 print:border-black">
              <h2 className="text-xs font-mono font-bold text-white print:text-black uppercase flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent-cyan print:hidden" /> Section 3: Performance Comparison
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full font-mono text-[11px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-zinc-950/40 text-zinc-500 text-[9px]">
                    <th className="p-3.5 uppercase font-bold tracking-wider">Operational Metric</th>
                    <th className="p-3.5 uppercase font-bold tracking-wider text-right">This Week</th>
                    <th className="p-3.5 uppercase font-bold tracking-wider text-right">vs Previous Week</th>
                    <th className="p-3.5 uppercase font-bold tracking-wider text-right">vs 30-Day Average</th>
                    <th className="p-3.5 uppercase font-bold tracking-wider text-right">30d Weekly scaled</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border-subtle/40">
                    <td className="p-3.5 font-bold text-white print:text-black">Hunting Hours</td>
                    <td className="p-3.5 text-right text-zinc-300">{report.comparison.huntingHours.thisWeekValue.toFixed(1)}h</td>
                    <td className="p-3.5 text-right">{renderDeltaBadge(report.comparison.huntingHours.prevWeekDiffPercent)}</td>
                    <td className="p-3.5 text-right">{renderDeltaBadge(report.comparison.huntingHours.avg30dDiffPercent)}</td>
                    <td className="p-3.5 text-right text-zinc-500">{report.comparison.huntingHours.avg30dValue.toFixed(1)}h</td>
                  </tr>
                  <tr className="border-b border-border-subtle/40">
                    <td className="p-3.5 font-bold text-white print:text-black">Learning Hours</td>
                    <td className="p-3.5 text-right text-zinc-300">{report.comparison.learningHours.thisWeekValue.toFixed(1)}h</td>
                    <td className="p-3.5 text-right">{renderDeltaBadge(report.comparison.learningHours.prevWeekDiffPercent)}</td>
                    <td className="p-3.5 text-right">{renderDeltaBadge(report.comparison.learningHours.avg30dDiffPercent)}</td>
                    <td className="p-3.5 text-right text-zinc-500">{report.comparison.learningHours.avg30dValue.toFixed(1)}h</td>
                  </tr>
                  <tr className="border-b border-border-subtle/40">
                    <td className="p-3.5 font-bold text-white print:text-black">Habit Consistency</td>
                    <td className="p-3.5 text-right text-zinc-300">{report.comparison.consistency.thisWeekValue}%</td>
                    <td className="p-3.5 text-right">{renderDeltaBadge(report.comparison.consistency.prevWeekDiffPercent, true)}</td>
                    <td className="p-3.5 text-right">{renderDeltaBadge(report.comparison.consistency.avg30dDiffPercent, true)}</td>
                    <td className="p-3.5 text-right text-zinc-500">{report.comparison.consistency.avg30dValue}%</td>
                  </tr>
                  <tr className="border-b border-border-subtle/40">
                    <td className="p-3.5 font-bold text-white print:text-black">Submitted Reports</td>
                    <td className="p-3.5 text-right text-zinc-300">{report.comparison.reportsSubmitted.thisWeekValue}</td>
                    <td className="p-3.5 text-right">{renderDeltaBadge(report.comparison.reportsSubmitted.prevWeekDiffPercent)}</td>
                    <td className="p-3.5 text-right">{renderDeltaBadge(report.comparison.reportsSubmitted.avg30dDiffPercent)}</td>
                    <td className="p-3.5 text-right text-zinc-500">{report.comparison.reportsSubmitted.avg30dValue.toFixed(1)}</td>
                  </tr>
                  <tr className="border-b border-border-subtle/40">
                    <td className="p-3.5 font-bold text-white print:text-black">Valid Reports</td>
                    <td className="p-3.5 text-right text-zinc-300">{report.comparison.validReports.thisWeekValue}</td>
                    <td className="p-3.5 text-right">{renderDeltaBadge(report.comparison.validReports.prevWeekDiffPercent)}</td>
                    <td className="p-3.5 text-right">{renderDeltaBadge(report.comparison.validReports.avg30dDiffPercent)}</td>
                    <td className="p-3.5 text-right text-zinc-500">{report.comparison.validReports.avg30dValue.toFixed(1)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Panel>

          {/* SECTION 7: HABIT REVIEW */}
          <Panel className="space-y-4 print:border-2 print:border-black print:p-4">
            <div className="border-b border-border-subtle pb-3 print:border-b-2 print:border-black">
              <h2 className="text-xs font-mono font-bold text-white print:text-black uppercase flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success-emerald print:hidden" /> Section 7: Daily Habit Review
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-zinc-400 print:text-black">
              
              <div className="bg-zinc-950/40 p-3.5 rounded border border-border-subtle/50 print:bg-white print:border-black">
                <span className="text-[9px] uppercase text-zinc-500 block font-bold">Operational Consistency</span>
                <span className="text-white print:text-black font-bold text-sm block mt-0.5">{report.habitReview.consistencyScore}%</span>
                <div className="text-[8px] text-zinc-500 mt-1 uppercase">
                  100% Productive Activity Pacing
                </div>
              </div>

              <div className="bg-zinc-950/40 p-3.5 rounded border border-border-subtle/50 print:bg-white print:border-black">
                <span className="text-[9px] uppercase text-zinc-500 block font-bold">Execution Completion</span>
                <span className="text-white print:text-black font-bold text-sm block mt-0.5">{report.habitReview.completionRate}%</span>
                <div className="text-[8px] text-zinc-500 mt-1 uppercase">
                  Workweek Target Execution
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-[10px] bg-zinc-950/50 p-3 rounded.5 border border-border-subtle/30 text-zinc-400 print:text-black print:bg-white print:border-black">
              <div className="space-y-1">
                <div>&bull; <strong>Overall Habit Completion Rate</strong>: {report.habitReview.completionRate}%</div>
              </div>
              <div className="space-y-1">
                <div>&bull; <strong>Weighted Habit Consistency Score</strong>: {report.habitReview.consistencyScore}%</div>
              </div>
            </div>
          </Panel>

        </div>

        {/* RIGHT COLUMN: SECTIONS 4, 5, 6, 8, 9, 10 */}
        <div className="space-y-6 print:col-span-1 print:space-y-4">
          
          {/* SECTION 10: NEXT WEEK SNAPSHOT */}
          <Panel className="space-y-4 border border-accent-cyan/30 bg-accent-cyan/5 print:border-2 print:border-black print:p-4">
            <div className="border-b border-accent-cyan/20 pb-3 flex justify-between items-center print:border-b-2 print:border-black">
              <h3 className="text-xs font-mono font-bold text-white print:text-black uppercase flex items-center gap-2">
                <Flame className="w-4 h-4 text-accent-cyan print:hidden animate-pulse" /> Section 10: Next Week Snapshot
              </h3>
            </div>

            <div className="space-y-3 font-mono text-[10px] leading-relaxed text-zinc-300 print:text-black">
              <div className="bg-zinc-950/80 p-2.5 rounded border border-border-subtle/30 print:bg-white print:border-black">
                <span className="text-accent-cyan uppercase font-bold text-[8px] block mb-0.5">Focus Target</span>
                {report.nextWeekSnapshot.focusTarget}
              </div>

              <div className="bg-zinc-950/80 p-2.5 rounded border border-border-subtle/30 print:bg-white print:border-black">
                <span className="text-success-emerald uppercase font-bold text-[8px] block mb-0.5">Focus Topic</span>
                {report.nextWeekSnapshot.focusTopic}
              </div>

              <div className="bg-zinc-950/80 p-2.5 rounded border border-border-subtle/30 print:bg-white print:border-black">
                <span className="text-warning-amber uppercase font-bold text-[8px] block mb-0.5">Consistency Goal</span>
                {report.nextWeekSnapshot.focusTopic}
              </div>
            </div>
          </Panel>

          {/* SECTION 4: TOP TARGETS */}
          <Panel className="space-y-4 print:border-2 print:border-black print:p-4">
            <div className="border-b border-border-subtle pb-3 print:border-b-2 print:border-black">
              <h3 className="text-xs font-mono font-bold text-white print:text-black uppercase flex items-center gap-2">
                <Target className="w-4 h-4 text-accent-cyan print:hidden" /> Section 4: Target Rankings
              </h3>
            </div>

            <div className="space-y-3 font-mono text-[10px]">
              {report.topTargetsRanked.length === 0 ? (
                <div className="text-zinc-600">No target hunting sessions logged.</div>
              ) : (
                report.topTargetsRanked.map((t, idx) => (
                  <div key={idx} className="bg-zinc-950/60 border border-border-subtle/40 p-2.5 rounded print:bg-white print:border-black">
                    <div className="flex justify-between items-center font-bold text-white print:text-black mb-1 border-b border-border-subtle/20 pb-1">
                      <span>{idx + 1}. {t.name}</span>
                      <span className="text-accent-cyan">{t.hours.toFixed(1)}h</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-zinc-500">
                      <div>Reports: <strong className="text-zinc-300">{t.reportsSubmitted}</strong></div>
                      <div>Valid: <strong className="text-zinc-300">{t.validReports}</strong></div>
                      <div className="text-right">Rate: <strong className="text-zinc-300">{t.hoursPerValidReport === "N/A" ? "N/A" : `${t.hoursPerValidReport}h`}</strong></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>

          {/* SECTION 5: TOP LEARNING */}
          <Panel className="space-y-4 print:border-2 print:border-black print:p-4">
            <div className="border-b border-border-subtle pb-3 print:border-b-2 print:border-black">
              <h3 className="text-xs font-mono font-bold text-white print:text-black uppercase flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent-cyan print:hidden" /> Section 5: Learning Rankings
              </h3>
            </div>

            <div className="space-y-3 font-mono text-[10px]">
              {report.topLearningRanked.length === 0 ? (
                <div className="text-zinc-600">No topic study sessions logged.</div>
              ) : (
                report.topLearningRanked.map((t, idx) => (
                  <div key={idx} className="bg-zinc-950/60 border border-border-subtle/40 p-2.5 rounded print:bg-white print:border-black">
                    <div className="flex justify-between items-center font-bold text-white print:text-black mb-1 border-b border-border-subtle/20 pb-1">
                      <span>{idx + 1}. {t.name}</span>
                      <span className="text-success-emerald">{t.hours.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Sessions: <strong className="text-zinc-300">{t.sessions}</strong></span>
                      <span>Last Studied: <strong className="text-zinc-300">{t.lastStudied}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>

          {/* SECTION 6: DISCOVERIES */}
          <Panel className="space-y-4 print:border-2 print:border-black print:p-4">
            <div className="border-b border-border-subtle pb-3 print:border-b-2 print:border-black">
              <h2 className="text-xs font-mono font-bold text-white print:text-black uppercase flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-warning-amber print:hidden" /> Section 6: Discoveries
              </h2>
            </div>

            <div className="space-y-3 font-mono text-[10px] leading-relaxed">
              {report.discoveries.length === 0 ? (
                <div className="text-zinc-500">Not enough data to calculate observations.</div>
              ) : (
                report.discoveries.map((disc, idx) => (
                  <div key={idx} className="bg-zinc-950/40 border border-border-subtle/50 p-2.5 rounded flex flex-col items-start print:bg-white print:border-black">
                    <span className="text-zinc-300 print:text-black">{disc.text}</span>
                    {renderConfidenceBadge(disc.confidence)}
                  </div>
                ))
              )}
            </div>
          </Panel>

          {/* SECTION 8: ACHIEVEMENTS */}
          <Panel className="space-y-4 print:border-2 print:border-black print:p-4">
            <div className="border-b border-border-subtle pb-3 print:border-b-2 print:border-black">
              <h3 className="text-xs font-mono font-bold text-white print:text-black uppercase flex items-center gap-2">
                <Award className="w-4 h-4 text-success-emerald print:hidden" /> Section 8: Achievements
              </h3>
            </div>
            
            <ul className="space-y-2 font-mono text-[10px] text-zinc-400 print:text-black">
              {report.achievements.map((ach, idx) => (
                <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                  <span className="text-success-emerald font-bold shrink-0">&bull;</span>
                  <span>{ach}</span>
                </li>
              ))}
            </ul>
          </Panel>

          {/* SECTION 9: RECOMMENDATIONS */}
          <Panel className="space-y-4 print:border-2 print:border-black print:p-4">
            <div className="border-b border-border-subtle pb-3 print:border-b-2 print:border-black">
              <h3 className="text-xs font-mono font-bold text-white print:text-black uppercase flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-warning-amber print:hidden" /> Section 9: Recommendations
              </h3>
            </div>
            
            <ul className="space-y-2 font-mono text-[10px] text-zinc-400 print:text-black">
              {report.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-zinc-950/40 border border-border-subtle/50 p-2 rounded leading-relaxed print:bg-white print:border-black">
                  <span className="text-warning-amber font-bold shrink-0 mt-0.5">&bull;</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </Panel>

        </div>

      </div>
      
    </div>
  );
}
