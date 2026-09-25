"use client";

import * as React from "react";
import { X, Calendar, Shield, Tag, RotateCcw, Check, Sparkles } from "lucide-react";
import type { MonthlyCalendarDay } from "@/lib/services/calendar/monthlyCalendar";

interface DayEditorModalProps {
  day: MonthlyCalendarDay | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (date: string, status: "WORKDAY" | "HOLIDAY", topic: string) => Promise<void>;
  onRevert: (date: string) => Promise<void>;
}

export default function DayEditorModal({
  day,
  isOpen,
  onClose,
  onSave,
  onRevert,
}: DayEditorModalProps) {
  const [selectedStatus, setSelectedStatus] = React.useState<"WORKDAY" | "HOLIDAY">("WORKDAY");
  const [topic, setTopic] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (day) {
      setSelectedStatus(day.plannedStatus);
      setTopic(day.topic || "");
      setError(null);
    }
  }, [day]);

  if (!isOpen || !day) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(day.date, selectedStatus, topic);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = async () => {
    setSaving(true);
    setError(null);
    try {
      await onRevert(day.date);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to revert day.");
    } finally {
      setSaving(false);
    }
  };

  // Format date nicely: e.g. "Friday, September 25, 2026"
  const dateObj = new Date(`${day.date}T00:00:00Z`);
  const formattedDateTitle = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const defaultStatusName = day.isDefaultWorkday ? "Workday (Mon–Fri)" : "Holiday (Weekend)";
  const isCurrentlyOverridden = day.isOverridden || (day.topic !== null && day.topic !== "");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-editor-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-6 text-zinc-100 font-sans relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <h2 id="day-editor-title" className="text-base font-bold text-white tracking-tight">
                {formattedDateTitle}
              </h2>
            </div>
            <p className="text-xs text-zinc-500 font-mono">
              Default: <span className="text-zinc-400">{defaultStatusName}</span>
              {isCurrentlyOverridden && (
                <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] uppercase font-bold">
                  Custom Override
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors"
            title="Close editor"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-950/50 border border-red-800/50 text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {/* Status Selector */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-medium">
            Planned Status
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedStatus("WORKDAY")}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-xs font-mono ${
                selectedStatus === "WORKDAY"
                  ? "bg-cyan-950/50 border-cyan-500/60 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              <span className="font-bold text-sm tracking-wide">WORKDAY</span>
              <span className="text-[11px] text-zinc-500 mt-0.5">8h standard allocation</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("HOLIDAY")}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-xs font-mono ${
                selectedStatus === "HOLIDAY"
                  ? "bg-amber-950/40 border-amber-500/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                  : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              <span className="font-bold text-sm tracking-wide">HOLIDAY</span>
              <span className="text-[11px] text-zinc-500 mt-0.5">0h allocation</span>
            </button>
          </div>
        </div>

        {/* Topic Input */}
        <div className="space-y-2">
          <label htmlFor="day-topic-input" className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-medium flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Tag size={12} className="text-cyan-400" />
              Day Topic / Note (Optional)
            </span>
            <span className="text-[10px] text-zinc-500 normal-case">Metadata only</span>
          </label>
          <input
            id="day-topic-input"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. HubSpot access control, Family function, Recon Saturday"
            maxLength={100}
            className="w-full px-3.5 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-sans transition-colors"
          />
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Topics provide calendar context and do not alter work hours, pace, or performance requirements.
          </p>
        </div>

        {/* Actual Work (Display-Only) */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-medium">
              Actual Work Time
            </span>
            <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500">
              <Shield size={11} className="text-cyan-400" />
              <span>Windows Agent (Read-only)</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-zinc-900/50 border border-zinc-800/80 rounded-xl">
            <div>
              <span className="text-2xl font-black font-mono text-white tracking-tight">
                {day.actualWorkFormatted}
              </span>
              <span className="text-xs text-zinc-500 ml-2 font-mono">
                ({day.actualWorkHours.toFixed(2)}h)
              </span>
            </div>

            {day.actualWorkSeconds > 0 ? (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 flex items-center gap-1">
                <Check size={11} /> Verified Active
              </span>
            ) : (
              <span className="text-[11px] font-mono text-zinc-500">
                No activity recorded
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 italic">
            Actual Work Time is measured exclusively by the Windows Agent and cannot be manually entered.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
          <div>
            {isCurrentlyOverridden && (
              <button
                type="button"
                onClick={handleRevert}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors font-mono disabled:opacity-50"
                title="Reset this day back to default calendar status and remove topic"
              >
                <RotateCcw size={12} />
                Revert to Default
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
