"use client";

import * as React from "react";
import { X, FileText, CheckCircle2, TrendingUp, Calendar, Clock, Award } from "lucide-react";
import type { MonthlyCalendarReport } from "@/lib/services/calendar/monthlyCalendar";

interface MonthlyReportModalProps {
  report: MonthlyCalendarReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MonthlyReportModal({
  report,
  isOpen,
  onClose,
}: MonthlyReportModalProps) {
  if (!isOpen || !report) return null;

  const isMet = report.actualWorkHours >= report.requiredHours;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="monthly-report-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl space-y-6 text-zinc-100 font-sans relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h2 id="monthly-report-title" className="text-lg font-bold text-white tracking-tight">
                {report.monthName} {report.year} — Monthly Report
              </h2>
            </div>
            <p className="text-xs text-zinc-500 font-mono">
              Canonical aggregation from Monthly Calendar & Windows Work Time Agent.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors"
            title="Close report"
          >
            <X size={18} />
          </button>
        </div>

        {/* Primary Status Banner */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            isMet
              ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-300"
              : "bg-cyan-950/30 border-cyan-800/50 text-cyan-300"
          }`}
        >
          <div className="flex items-center gap-3">
            {isMet ? (
              <CheckCircle2 size={24} className="text-emerald-400" />
            ) : (
              <Clock size={24} className="text-cyan-400" />
            )}
            <div>
              <div className="font-bold text-sm">
                {isMet
                  ? `Monthly Requirement Achieved (${report.completionPercentage}%)`
                  : `Monthly Progress: ${report.completionPercentage}% Completed`}
              </div>
              <div className="text-xs text-zinc-400">
                {isMet
                  ? `Secured with +${report.surplusDeficitHours}h surplus over planned standard.`
                  : `${Math.abs(report.surplusDeficitHours)}h remaining against planned standard.`}
              </div>
            </div>
          </div>
        </div>

        {/* Canonical Report Metrics Table */}
        <div className="divide-y divide-zinc-900 border border-zinc-800/80 rounded-xl bg-zinc-900/40 overflow-hidden font-mono text-xs">
          
          <div className="flex items-center justify-between p-3.5 hover:bg-zinc-900/60 transition-colors">
            <span className="text-zinc-400 flex items-center gap-2">
              <Calendar size={13} className="text-zinc-500" /> Planned Workdays
            </span>
            <span className="font-bold text-white text-sm">
              {report.plannedWorkdays}
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 hover:bg-zinc-900/60 transition-colors">
            <span className="text-zinc-400 flex items-center gap-2">
              <Calendar size={13} className="text-zinc-500" /> Planned Holidays
            </span>
            <span className="font-bold text-zinc-300 text-sm">
              {report.plannedHolidays}
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 hover:bg-zinc-900/60 transition-colors">
            <span className="text-zinc-400 flex items-center gap-2">
              <Clock size={13} className="text-zinc-500" /> Required Hours
            </span>
            <span className="font-bold text-white text-sm">
              {report.requiredHours}h
              <span className="text-[10px] text-zinc-500 font-normal ml-1">
                ({report.plannedWorkdays} × 8h)
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-zinc-950/60 hover:bg-zinc-900/60 transition-colors">
            <span className="text-cyan-300 font-medium flex items-center gap-2">
              <TrendingUp size={13} className="text-cyan-400" /> Actual Work Time
            </span>
            <span className="font-black text-cyan-400 text-base tracking-tight">
              {report.actualWorkFormatted}
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 hover:bg-zinc-900/60 transition-colors">
            <span className="text-zinc-400 flex items-center gap-2">
              <Clock size={13} className="text-zinc-500" /> Average / Workday
            </span>
            <span className="font-bold text-white text-sm">
              {report.averageHoursPerWorkdayFormatted}
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 hover:bg-zinc-900/60 transition-colors">
            <span className="text-zinc-400 flex items-center gap-2">
              <CheckCircle2 size={13} className="text-zinc-500" /> Days Worked
            </span>
            <span className="font-bold text-emerald-400 text-sm">
              {report.daysWorked} days
            </span>
          </div>

          {report.highestWorkDay && (
            <div className="flex items-center justify-between p-3.5 hover:bg-zinc-900/60 transition-colors">
              <span className="text-zinc-400 flex items-center gap-2">
                <Award size={13} className="text-amber-400" /> Highest Work Day
              </span>
              <span className="font-bold text-amber-300 text-sm">
                {report.highestWorkDay.formatted}
                <span className="text-[10px] text-zinc-500 font-normal ml-1.5">
                  ({report.highestWorkDay.date})
                </span>
              </span>
            </div>
          )}

        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
          This report is derived solely from the Monthly Calendar plan (workday/holiday schedule)
          and the authoritative Windows Work Time Agent. Individual dates are immutable historical records.
        </p>

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-white transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
