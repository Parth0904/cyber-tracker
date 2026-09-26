"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  ShieldAlert,
  CalendarDays,
  Flame,
  Loader2,
} from "lucide-react";
import type { ParentPortalPayload } from "@/lib/services/parentPortal/portalData";

export default function ParentPortalPage() {
  const params = useParams();
  const token = params?.token as string;

  const [data, setData] = React.useState<ParentPortalPayload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errorStatus, setErrorStatus] = React.useState<"revoked" | "not_found" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string>("");

  // Month navigation state
  const [currentYear, setCurrentYear] = React.useState<number | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = React.useState<number | undefined>(undefined);

  const fetchPortalData = React.useCallback(async (y?: number, m?: number) => {
    if (!token) return;
    setLoading(true);
    setErrorStatus(null);

    try {
      let url = `/api/parent/${encodeURIComponent(token)}`;
      if (y && m) {
        url += `?year=${y}&month=${m}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        setData(json.data);
        setCurrentYear(json.data.selectedMonth.year);
        setCurrentMonth(json.data.selectedMonth.month);
      } else {
        if (json.error === "revoked" || res.status === 403) {
          setErrorStatus("revoked");
          setErrorMessage(json.message || "This parent access link has been revoked.");
        } else if (json.error === "not_found" || res.status === 404) {
          setErrorStatus("not_found");
          setErrorMessage(json.message || "Invalid parent portal access link.");
        } else {
          setErrorStatus("error");
          setErrorMessage(json.message || "Failed to load parent portal data.");
        }
      }
    } catch (err) {
      console.error("Failed fetching parent portal data:", err);
      setErrorStatus("error");
      setErrorMessage("Network connection error. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    fetchPortalData();
  }, [fetchPortalData]);

  const handlePrevMonth = () => {
    if (!currentYear || !currentMonth) return;
    let prevM = currentMonth - 1;
    let prevY = currentYear;
    if (prevM < 1) {
      prevM = 12;
      prevY -= 1;
    }
    fetchPortalData(prevY, prevM);
  };

  const handleNextMonth = () => {
    if (!currentYear || !currentMonth) return;
    let nextM = currentMonth + 1;
    let nextY = currentYear;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    fetchPortalData(nextY, nextM);
  };

  const handleResetToCurrentMonth = () => {
    fetchPortalData();
  };

  // 1. Loading State (Full Skeleton matching Parent Portal)
  if (loading && !data) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 font-sans">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 animate-in fade-in duration-150">
          {/* Header Skeleton */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
            <div className="space-y-2">
              <div className="h-5 w-24 bg-zinc-800/60 rounded-full animate-pulse" />
              <div className="h-7 w-64 bg-zinc-800/40 rounded animate-pulse" />
              <div className="h-4 w-96 bg-zinc-900 rounded animate-pulse" />
            </div>
            <div className="h-9 w-40 bg-zinc-900 rounded-xl animate-pulse" />
          </header>

          {/* Top 3 Highlight Cards Skeleton */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
                <div className="h-4 w-28 bg-zinc-800/60 rounded animate-pulse" />
                <div className="h-8 w-20 bg-zinc-800/40 rounded animate-pulse" />
                <div className="h-3 w-36 bg-zinc-900 rounded animate-pulse" />
              </div>
            ))}
          </section>

          {/* Calendar Grid Skeleton */}
          <section className="space-y-3">
            <div className="h-4 w-40 bg-zinc-800/60 rounded animate-pulse" />
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
              <div className="grid grid-cols-7 gap-2 mb-3">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="h-6 bg-zinc-900/60 rounded text-center text-xs font-mono text-zinc-600 flex items-center justify-center font-bold">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="min-h-[100px] rounded-xl border border-zinc-900 bg-zinc-950/40 p-2.5 flex flex-col justify-between">
                    <div className="h-3 w-6 bg-zinc-800/50 rounded animate-pulse" />
                    <div className="h-3 w-12 bg-zinc-900 rounded animate-pulse my-auto" />
                    <div className="h-2 w-14 bg-zinc-900/80 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // 2. Revoked Token Screen
  if (errorStatus === "revoked") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-zinc-100 font-sans">
        <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800/60 flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert size={24} />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-white tracking-tight">Parent Link Unavailable</h1>
            <p className="text-sm text-zinc-400">{errorMessage}</p>
          </div>
          <p className="text-xs text-zinc-600 font-mono pt-2">
            If you need access, please request a newly generated link from the student.
          </p>
        </div>
      </div>
    );
  }

  // 3. Not Found or General Error Screen
  if (errorStatus || !data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-zinc-100 font-sans">
        <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-amber-950/60 border border-amber-800/60 flex items-center justify-center mx-auto text-amber-400">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-white tracking-tight">
              {errorStatus === "not_found" ? "Invalid Access Link" : "Failed to Load"}
            </h1>
            <p className="text-sm text-zinc-400">{errorMessage || "This link could not be verified."}</p>
          </div>
          {errorStatus === "error" ? (
            <button
              onClick={() => fetchPortalData(currentYear, currentMonth)}
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-white hover:bg-zinc-800 transition-colors"
            >
              Retry Connection
            </button>
          ) : (
            <p className="text-xs text-zinc-600 font-mono pt-2">
              Please make sure you have copied the entire shareable URL.
            </p>
          )}
        </div>
      </div>
    );
  }

  const { selectedMonth, recentPerformance, allTimeSummary, studentName, label } = data;
  const isMonthMet = selectedMonth.actualWorkHours >= selectedMonth.requiredHours;

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className={`max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 transition-opacity duration-150 ${loading ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
        
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
                Parent View
              </span>
              {label && (
                <span className="text-xs text-zinc-400 font-medium">
                  • {label}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>CYBER TRACKER</span>
              <span className="text-xs font-mono font-normal text-zinc-500 uppercase tracking-widest hidden sm:inline">
                // {studentName}&apos;s Live Progress
              </span>
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
              Verified daily tracking and monthly schedule for {studentName}. Work time is recorded automatically by the Windows Agent.
            </p>
          </div>

          {/* Month Selector Buttons */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={handlePrevMonth}
              disabled={loading}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors disabled:opacity-50"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-3 py-1 font-mono text-xs font-bold text-white whitespace-nowrap flex items-center gap-1.5">
              <span>{selectedMonth.monthName} {selectedMonth.year}</span>
              {loading && <Loader2 size={12} className="animate-spin text-cyan-400" />}
            </div>
            <button
              onClick={handleNextMonth}
              disabled={loading}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors disabled:opacity-50"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={handleResetToCurrentMonth}
              disabled={loading}
              className="ml-1 px-2.5 py-1 text-[11px] font-mono text-zinc-400 hover:text-cyan-400 hover:bg-zinc-900 rounded-lg transition-colors border-l border-zinc-800"
              title="Reset to current month"
            >
              Current
            </button>
          </div>
        </header>

        {/* TOP 3 HIGHLIGHT CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* 1. Planned Work */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-2.5 relative overflow-hidden">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} className="text-zinc-500" /> Planned Work
              </span>
              <span className="font-mono text-[11px] text-zinc-500">
                {selectedMonth.monthName}
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {selectedMonth.requiredHours}h
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {selectedMonth.plannedWorkdays} Workdays · {selectedMonth.plannedHolidays} Holidays
              </p>
            </div>
          </div>

          {/* 2. Actual Work */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-2.5 relative overflow-hidden">
            <div className="flex items-center justify-between text-cyan-400 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <TrendingUp size={14} /> Actual Work
              </span>
              <span className="font-mono text-[11px] text-cyan-500/80">
                {selectedMonth.daysWorked} active days
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 tracking-tight">
                {selectedMonth.actualWorkFormatted}
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Verified work time recorded by agent
              </p>
            </div>
          </div>

          {/* 3. Remaining / Completion */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-2.5 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-1.5 text-zinc-400">
                {isMonthMet ? (
                  <CheckCircle2 size={14} className="text-emerald-400" />
                ) : (
                  <Clock size={14} className="text-zinc-500" />
                )}
                {isMonthMet ? "Requirement Met" : "Remaining"}
              </span>
              <span
                className={`font-mono text-[11px] font-bold ${
                  isMonthMet ? "text-emerald-400" : "text-zinc-400"
                }`}
              >
                {selectedMonth.completionPercentage}% Done
              </span>
            </div>
            <div>
              <div
                className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  isMonthMet ? "text-emerald-400" : "text-white"
                }`}
              >
                {isMonthMet ? "Completed" : `${selectedMonth.remainingHours}h remaining`}
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {isMonthMet
                  ? "Monthly plan achieved"
                  : `Pace: ${selectedMonth.requiredDailyPaceFormatted} needed per remaining workday`}
              </p>
            </div>
          </div>
        </section>

        {/* MONTH CALENDAR VIEW */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Calendar size={16} className="text-cyan-400" />
                {selectedMonth.monthName} {selectedMonth.year} Calendar
              </h2>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                // Read-only observation view. Topics & schedule planned by {studentName}.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-zinc-900 border border-zinc-700" /> Workday
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-950 border border-red-800" /> Holiday
              </span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="w-full overflow-x-auto">
            <div className="min-w-[650px]">
              {/* Days of week header */}
              <div
                className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-[10px] sm:text-xs font-mono font-bold uppercase text-zinc-500"
                style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
              >
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
                <div>Sun</div>
              </div>

              {/* Calendar Days */}
              <div
                className="grid grid-cols-7 gap-1 sm:gap-2"
                style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
              >
                {/* Empty placeholder offset cells */}
                {Array.from({ length: selectedMonth.firstDayOfWeekOffset }).map((_, idx) => (
                  <div
                    key={`offset-${idx}`}
                    className="min-h-[70px] sm:min-h-[92px] rounded-xl bg-zinc-950/20 border border-transparent"
                  />
                ))}

                {/* Real month days */}
                {selectedMonth.days.map((day) => {
                  const isWorkday = day.plannedStatus === "WORKDAY";
                  const hasWorked = day.actualWorkSeconds > 0;

                  return (
                    <div
                      key={day.date}
                      className={`min-h-[70px] sm:min-h-[92px] p-2 sm:p-2.5 rounded-xl border flex flex-col justify-between transition-all select-none relative ${
                        day.isToday
                          ? "bg-zinc-900/90 border-cyan-500 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/50"
                          : isWorkday
                          ? "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700"
                          : "bg-red-950/10 border-zinc-900/80 hover:border-red-900/40"
                      }`}
                    >
                      {/* Top Row: Day Number and Status Badge */}
                      <div className="flex items-start justify-between gap-1">
                        <span
                          className={`text-xs sm:text-sm font-bold font-mono ${
                            day.isToday
                              ? "text-cyan-400 font-black"
                              : day.isFuture
                              ? "text-zinc-600"
                              : "text-white"
                          }`}
                        >
                          {day.dayOfMonth}
                        </span>

                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold ${
                            isWorkday
                              ? "bg-zinc-900 text-zinc-300 border border-zinc-800"
                              : "bg-red-950/50 text-red-400 border border-red-900/50"
                          }`}
                        >
                          {isWorkday ? "Work" : "Holiday"}
                        </span>
                      </div>

                      {/* Middle: Daily Target & Optional Topic */}
                      <div className="my-0.5 space-y-0.5">
                        <div className="text-[10px] font-mono">
                          <span
                            className={
                              day.dailyTargetFormatted === "10+ hr needed"
                                ? "text-amber-400 font-bold"
                                : day.isToday && isWorkday
                                ? "text-cyan-400 font-bold"
                                : isWorkday && day.isFuture
                                ? "text-zinc-400 font-medium"
                                : "text-zinc-600"
                            }
                          >
                            {day.dailyTargetFormatted}
                          </span>
                        </div>
                        {day.topic && (
                          <div
                            className="text-[10px] text-zinc-400 line-clamp-1 truncate font-medium"
                            title={day.topic}
                          >
                            {day.topic}
                          </div>
                        )}
                      </div>

                      {/* Bottom: Actual Work Logged */}
                      <div className="pt-1 border-t border-zinc-900/60 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-zinc-600 text-[9px] uppercase">
                          {hasWorked ? "Worked" : ""}
                        </span>
                        <span
                          className={`font-bold ${
                            hasWorked
                              ? "text-emerald-400"
                              : day.isFuture
                              ? "text-zinc-700"
                              : "text-zinc-600"
                          }`}
                        >
                          {hasWorked ? day.actualWorkFormatted : day.isFuture ? "—" : "0h 00m"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* MONTH SUMMARY */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 space-y-4">
          <div className="border-b border-zinc-800/80 pb-3">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Clock size={16} className="text-cyan-400" />
              {selectedMonth.monthName} Summary
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
            <div className="bg-zinc-900/40 border border-zinc-800/80 p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Planned</span>
              <div className="text-lg font-bold text-white">{selectedMonth.requiredHours}h</div>
              <span className="text-[10px] text-zinc-500">{selectedMonth.plannedWorkdays} workdays</span>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-cyan-400 block">Worked</span>
              <div className="text-lg font-bold text-cyan-400">{selectedMonth.actualWorkFormatted}</div>
              <span className="text-[10px] text-zinc-500">Recorded by agent</span>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Remaining</span>
              <div className="text-lg font-bold text-white">{selectedMonth.remainingHours}h</div>
              <span className="text-[10px] text-zinc-500">{selectedMonth.completionPercentage}% of plan</span>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Avg / Workday</span>
              <div className="text-lg font-bold text-white">{selectedMonth.averageHoursPerWorkdayFormatted}</div>
              <span className="text-[10px] text-zinc-500">Per planned day</span>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Days Worked</span>
              <div className="text-lg font-bold text-emerald-400">{selectedMonth.daysWorked}</div>
              <span className="text-[10px] text-zinc-500">Days active</span>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Holidays</span>
              <div className="text-lg font-bold text-zinc-300">{selectedMonth.plannedHolidays}</div>
              <span className="text-[10px] text-zinc-500">Planned days off</span>
            </div>
          </div>
        </section>

        {/* RECENT PERFORMANCE (LAST 7 DAYS) */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 space-y-4">
          <div className="border-b border-zinc-800/80 pb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Flame size={16} className="text-amber-400" />
              Recent Performance
            </h2>
            <span className="text-xs text-zinc-500 font-mono">Last 7 Calendar Days</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 font-mono">
            {recentPerformance.map((item) => (
              <div
                key={item.date}
                className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                  item.isToday
                    ? "bg-zinc-900 border-cyan-500/80 ring-1 ring-cyan-500/40"
                    : "bg-zinc-900/40 border-zinc-800/80"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{item.dayOfWeek}</span>
                  <span className="text-[10px] text-zinc-500">{item.formattedDate}</span>
                </div>

                <div className="space-y-0.5">
                  <div
                    className={`text-base font-bold ${
                      item.actualWorkSeconds > 0 ? "text-emerald-400" : "text-zinc-600"
                    }`}
                  >
                    {item.actualWorkSeconds > 0 ? item.actualWorkFormatted : "0h 00m"}
                  </div>
                  <div className={`text-[9px] uppercase font-bold tracking-wider ${
                    item.plannedStatus === "HOLIDAY" ? "text-red-400" : "text-zinc-500"
                  }`}>
                    {item.plannedStatus}
                  </div>
                </div>

                {item.isToday && (
                  <div className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">
                    • Today
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ALL-TIME GLOBAL SUMMARY */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 space-y-4">
          <div className="border-b border-zinc-800/80 pb-3">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Award size={16} className="text-cyan-400" />
              All-Time Summary
            </h2>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              // Lifetime verified statistics across all recorded work history.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
            <div className="bg-zinc-900/40 border border-zinc-800/80 p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total Work</span>
              <div className="text-lg font-bold text-cyan-400">{allTimeSummary.totalWorkFormatted}</div>
              <span className="text-[10px] text-zinc-500">All-time active</span>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Average / Day</span>
              <div className="text-lg font-bold text-white">{allTimeSummary.averagePerTrackedDayFormatted}</div>
              <span className="text-[10px] text-zinc-500">Tracked days</span>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Avg / Workday</span>
              <div className="text-lg font-bold text-white">{allTimeSummary.averagePerWorkdayFormatted}</div>
              <span className="text-[10px] text-zinc-500">Planned workdays</span>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Active Days</span>
              <div className="text-lg font-bold text-emerald-400">{allTimeSummary.activeDaysCount}</div>
              <span className="text-[10px] text-zinc-500">Days with work</span>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Highest Day</span>
              <div className="text-lg font-bold text-amber-300">
                {allTimeSummary.highestDay ? allTimeSummary.highestDay.formattedDuration : "—"}
              </div>
              <span className="text-[10px] text-zinc-500 truncate block">
                {allTimeSummary.highestDay ? allTimeSummary.highestDay.formattedDate : "No data"}
              </span>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Lowest Active</span>
              <div className="text-lg font-bold text-zinc-300">
                {allTimeSummary.lowestActiveDay ? allTimeSummary.lowestActiveDay.formattedDuration : "—"}
              </div>
              <span className="text-[10px] text-zinc-500 truncate block">
                {allTimeSummary.lowestActiveDay ? allTimeSummary.lowestActiveDay.formattedDate : "No data"}
              </span>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="text-center text-xs text-zinc-600 font-mono py-4 border-t border-zinc-900">
          Cyber Tracker Parent View • Read-Only Observation Link • Powered by Windows Work Time Agent
        </footer>

      </div>
    </div>
  );
}
