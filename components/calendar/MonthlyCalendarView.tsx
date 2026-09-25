"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Shield,
  FileText,
  RefreshCw,
  Tag,
  Clock,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import type {
  MonthlyCalendarView as MonthlyCalendarViewType,
  MonthlyCalendarDay,
  MonthlyCalendarReport,
} from "@/lib/services/calendar/monthlyCalendar";
import DayEditorModal from "./DayEditorModal";
import MonthlyReportModal from "./MonthlyReportModal";

export default function MonthlyCalendarView() {
  const now = new Date();
  const [currentYear, setCurrentYear] = React.useState<number>(now.getFullYear());
  const [currentMonth, setCurrentMonth] = React.useState<number>(now.getMonth() + 1);

  const [calendarData, setCalendarData] = React.useState<MonthlyCalendarViewType | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);

  // Day editor modal state
  const [editingDay, setEditingDay] = React.useState<MonthlyCalendarDay | null>(null);
  const [isEditorOpen, setIsEditorOpen] = React.useState<boolean>(false);

  // Monthly report modal state
  const [reportData, setReportData] = React.useState<MonthlyCalendarReport | null>(null);
  const [isReportOpen, setIsReportOpen] = React.useState<boolean>(false);

  const fetchCalendar = React.useCallback(async (year: number, month: number, isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch(`/api/calendar?year=${year}&month=${month}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.calendar) {
          setCalendarData(json.calendar);
        }
      }
    } catch (err) {
      console.error("Failed to load monthly calendar data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCalendar(currentYear, currentMonth);
  }, [currentYear, currentMonth, fetchCalendar]);

  // Periodic auto-refresh every 30s for live sync updates from Windows agent
  React.useEffect(() => {
    const timer = setInterval(() => {
      fetchCalendar(currentYear, currentMonth, true);
    }, 30000);
    return () => clearInterval(timer);
  }, [currentYear, currentMonth, fetchCalendar]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  };

  // Day Editor handlers
  const handleDayClick = (day: MonthlyCalendarDay) => {
    setEditingDay(day);
    setIsEditorOpen(true);
  };

  const handleSaveDayOverride = async (
    date: string,
    status: "WORKDAY" | "HOLIDAY",
    topic: string
  ) => {
    const res = await fetch("/api/calendar/day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, status, topic }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save day override");
    }

    await fetchCalendar(currentYear, currentMonth, true);
  };

  const handleRevertDayOverride = async (date: string) => {
    const res = await fetch(`/api/calendar/day?date=${date}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to revert day override");
    }

    await fetchCalendar(currentYear, currentMonth, true);
  };

  // Monthly Report handler
  const handleOpenReport = async () => {
    try {
      const res = await fetch(`/api/calendar/report?year=${currentYear}&month=${currentMonth}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.report) {
          setReportData(json.report);
          setIsReportOpen(true);
        }
      }
    } catch (err) {
      console.error("Failed to load monthly report:", err);
    }
  };

  if (loading && !calendarData) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-black text-zinc-400 font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span>LOADING_MONTHLY_CALENDAR_PLANNER...</span>
        </div>
      </div>
    );
  }

  // Calculate day-of-week offset for calendar grid (Monday = 0, Sunday = 6)
  const firstDay = calendarData?.days[0];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayOfWeekIndexMap: Record<string, number> = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
  };
  const leadingBlankDays = firstDay ? dayOfWeekIndexMap[firstDay.dayOfWeek] || 0 : 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-zinc-100 font-sans">
      
      {/* 1. TOP HEADER & TELEMETRY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2 font-mono">
              <CalendarIcon className="w-4 h-4 text-cyan-400" />
              MONTHLY CALENDAR PLANNER
            </h1>
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            // Planned Schedule: Monthly Calendar | Actual Work: Windows Agent
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchCalendar(currentYear, currentMonth, true)}
            disabled={refreshing}
            className="p-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh from Windows Agent"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin text-cyan-400" : ""} />
          </button>

          <button
            onClick={handleOpenReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 hover:border-zinc-700 text-xs font-mono font-bold text-zinc-300 hover:text-cyan-300 transition-colors"
          >
            <FileText size={13} className="text-cyan-400" />
            Monthly Report
          </button>

          <button
            onClick={handleGoToToday}
            className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-mono font-medium text-white transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* 2. MONTH NAVIGATION & TIMELINE BAR */}
      <div className="flex items-center justify-between bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-xl">
        <button
          onClick={handlePrevMonth}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900 text-xs font-mono text-zinc-300 hover:text-white transition-colors"
        >
          <ChevronLeft size={14} />
          <span>Previous Month</span>
        </button>

        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
            {calendarData?.monthName} {calendarData?.year}
          </h2>
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
            {calendarData?.totalDays} Days · {calendarData?.plannedWorkdays} Planned Workdays
          </span>
        </div>

        <button
          onClick={handleNextMonth}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900 text-xs font-mono text-zinc-300 hover:text-white transition-colors"
        >
          <span>Next Month</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* 3. CONCISE TOP METRICS SUMMARY (Section 10 Standard) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Workdays */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            Workdays
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {calendarData?.plannedWorkdays ?? 0}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            Planned working days
          </div>
        </div>

        {/* Holidays */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            Holidays
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-300">
            {calendarData?.plannedHolidays ?? 0}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            Weekends + custom off
          </div>
        </div>

        {/* Required */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            Required
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {calendarData?.monthlyRequiredHours ?? 0}h
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            {calendarData?.plannedWorkdays ?? 0} × 8h allocation
          </div>
        </div>

        {/* Worked */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 flex items-center justify-between">
            <span>Worked</span>
            <Shield size={11} className="text-cyan-400/80" />
          </div>
          <div className="text-2xl font-black font-mono text-cyan-400 tracking-tight">
            {calendarData?.actualWorkedFormatted ?? "0h 00m"}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            Windows Agent verified
          </div>
        </div>

        {/* Remaining */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            Remaining
          </div>
          <div className="text-2xl font-bold font-mono">
            {(calendarData?.remainingHours ?? 0) <= 0 ? (
              <span className="text-emerald-400 flex items-center gap-1 text-lg">
                <CheckCircle2 size={16} /> Target Met
              </span>
            ) : (
              <span className="text-amber-400">
                {calendarData?.remainingHoursFormatted ?? "0h 00m"}
              </span>
            )}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            {calendarData?.remainingWorkdays ?? 0} workdays left
          </div>
        </div>

        {/* Current Pace */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            Current Pace
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {calendarData?.requiredDailyPaceFormatted ?? "0h 00m"}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            Per remaining workday
          </div>
        </div>

      </div>

      {/* 4. CALENDAR GRID */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl overflow-hidden shadow-2xl">
        
        {/* Day-of-week Headers */}
        <div className="grid grid-cols-7 border-b border-zinc-800/80 bg-zinc-900/40 text-center text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 py-3">
          {dayNames.map((d, idx) => (
            <div
              key={d}
              className={idx >= 5 ? "text-amber-400/70" : "text-zinc-300"}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-zinc-900">
          
          {/* Leading empty cells */}
          {Array.from({ length: leadingBlankDays }).map((_, i) => (
            <div
              key={`blank-${i}`}
              className="min-h-[110px] sm:min-h-[130px] p-2 bg-zinc-950/40 opacity-25"
            />
          ))}

          {/* Calendar Days */}
          {calendarData?.days.map((day) => {
            const isWorkday = day.plannedStatus === "WORKDAY";
            const hasWork = day.actualWorkSeconds > 0;
            const metAllocation = isWorkday && day.actualWorkHours >= 8.0;

            return (
              <div
                key={day.date}
                onClick={() => handleDayClick(day)}
                className={`min-h-[110px] sm:min-h-[130px] p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer transition-all hover:bg-zinc-900/50 group relative ${
                  day.isToday
                    ? "bg-cyan-950/20 ring-1 ring-inset ring-cyan-500/50"
                    : isWorkday
                    ? "bg-zinc-950/50"
                    : "bg-zinc-950/80"
                }`}
              >
                {/* Top Row: Date & Status Badge */}
                <div className="flex items-start justify-between gap-1">
                  
                  {/* Date Number */}
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-sm sm:text-base font-bold font-mono ${
                        day.isToday
                          ? "w-6 h-6 rounded-full bg-cyan-400 text-black flex items-center justify-center font-black"
                          : "text-zinc-200 group-hover:text-white"
                      }`}
                    >
                      {day.dayOfMonth}
                    </span>
                    {day.isOverridden && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-amber-400"
                        title="Manual calendar override"
                      />
                    )}
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      isWorkday
                        ? "bg-cyan-950/70 text-cyan-300 border border-cyan-800/40"
                        : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                    }`}
                  >
                    {isWorkday ? "WORK" : "HOLIDAY"}
                  </span>
                </div>

                {/* Middle: Planned Allocation & Topic */}
                <div className="my-1.5 space-y-1">
                  
                  {/* Allocation */}
                  <div className="text-[10px] sm:text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                    <span>{isWorkday ? "8h planned" : "0h planned"}</span>
                  </div>

                  {/* Optional Topic Chip */}
                  {day.topic && (
                    <div
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 max-w-full truncate font-sans"
                      title={day.topic}
                    >
                      <Tag size={9} className="text-cyan-400 shrink-0" />
                      <span className="truncate">{day.topic}</span>
                    </div>
                  )}

                </div>

                {/* Bottom Row: Actual Work Time from Windows Agent */}
                <div className="pt-1 border-t border-zinc-900/80 flex items-baseline justify-between text-[11px] font-mono">
                  <span
                    className={`font-bold ${
                      metAllocation
                        ? "text-emerald-400"
                        : hasWork
                        ? "text-cyan-300"
                        : "text-zinc-600"
                    }`}
                  >
                    {day.actualWorkFormatted}
                  </span>

                  <span className="text-[9px] text-zinc-600 uppercase">
                    {hasWork ? "actual" : "idle"}
                  </span>
                </div>

              </div>
            );
          })}

        </div>

      </div>

      {/* Day Editor Modal */}
      <DayEditorModal
        day={editingDay}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveDayOverride}
        onRevert={handleRevertDayOverride}
      />

      {/* Monthly Report Modal */}
      <MonthlyReportModal
        report={reportData}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

    </div>
  );
}
