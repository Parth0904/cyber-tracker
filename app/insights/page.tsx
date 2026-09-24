"use client";

import * as React from "react";
import {
  Calendar,
  Clock,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  TrendingUp,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { Slider } from "@/components/ui/Slider";
import { EmptyState } from "@/components/ui/EmptyState";
import type {
  HolidayCapacityResult,
  HolidaySimulationResult,
} from "@/lib/services/holiday/holidayIntelligence";

export default function InsightsPage() {
  const [capacity, setCapacity] = React.useState<HolidayCapacityResult | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Calculator inputs
  const [holidays, setHolidays] = React.useState<number>(2);
  const [plannedDailyHours, setPlannedDailyHours] = React.useState<number>(9.0);
  const [includeWeekends, setIncludeWeekends] = React.useState<boolean>(false);
  const [simResult, setSimResult] = React.useState<HolidaySimulationResult | null>(null);
  const [simulating, setSimulating] = React.useState(false);

  // Fetch baseline capacity
  const fetchCapacity = async () => {
    try {
      const res = await fetch("/api/insights");
      if (res.ok) {
        const json = await res.json();
        setCapacity(json);
      }
    } catch (err) {
      console.error("Failed loading holiday capacity:", err);
    } finally {
      setLoading(false);
    }
  };

  // Run simulation
  const runSimulation = React.useCallback(
    async (h: number, hours: number, weekends: boolean) => {
      setSimulating(true);
      try {
        const res = await fetch("/api/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            holidays: h,
            plannedDailyHours: hours,
            includeWeekends: weekends,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          setSimResult(json);
        }
      } catch (err) {
        console.error("Simulation request failed:", err);
      } finally {
        setSimulating(false);
      }
    },
    []
  );

  React.useEffect(() => {
    fetchCapacity();
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation(holidays, plannedDailyHours, includeWeekends);
    }, 200);
    return () => clearTimeout(timer);
  }, [holidays, plannedDailyHours, includeWeekends, runSimulation]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-3 font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
        <Compass className="w-8 h-8 text-accent-cyan animate-spin" />
        <span>// COMPUTING_5DAY_WORKWEEK_HOLIDAY_MATRICES...</span>
      </div>
    );
  }

  if (!capacity) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState
          title="Holiday Intelligence Engine Offline"
          description="Could not compile workweek schedule matrices. Please ensure database connection is active."
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 text-zinc-200">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-tight text-white uppercase font-mono flex items-center gap-2">
              <Compass className="w-4 h-4 text-accent-cyan" /> Holiday Intelligence & Recovery Calculator
            </h1>
            <Badge variant="cyan" className="text-[9px] uppercase font-mono">
              5-Day Workweek Core
            </Badge>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1 font-mono">
            // Predictive capacity, time-off planning & recovery trajectory based on 8.0h/workday baseline.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 bg-zinc-950/80 border border-border-subtle px-3 py-1.5 rounded">
          <ShieldCheck className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
          <span>ZERO_DB_WRITES // 100% PREDICTIVE</span>
        </div>
      </div>

      {/* 2. DOMINANT CARD: HOLIDAY CAPACITY */}
      <div className="relative overflow-hidden rounded-xl border border-accent-cyan/30 bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-zinc-950 p-6 md:p-8 shadow-2xl shadow-accent-cyan/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-cyan/5 blur-3xl pointer-events-none rounded-full" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <Badge
                variant={
                  capacity.availableHolidays > 0
                    ? "cyan"
                    : capacity.status === "DEFICIT"
                    ? "warning"
                    : "neutral"
                }
                className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5"
              >
                {capacity.status === "SURPLUS_AVAILABLE"
                  ? "SURPLUS BUFFER ACTIVE"
                  : capacity.status === "DEFICIT"
                  ? "DEFICIT MODE"
                  : "BASELINE BALANCED"}
              </Badge>
              <span className="text-[11px] font-mono text-zinc-500">
                Baseline: Mon–Fri @ 8.0h/workday
              </span>
            </div>

            <div>
              <div className="text-xs uppercase font-mono tracking-wider text-zinc-400">
                Current Safe Holiday Capacity
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-5xl md:text-6xl font-black font-mono tracking-tight text-white">
                  {capacity.availableHolidays}
                </span>
                <span className="text-lg md:text-xl font-mono uppercase text-accent-cyan font-bold">
                  {capacity.availableHolidays === 1 ? "Workday Available" : "Workdays Available"}
                </span>
              </div>
            </div>

            <p className="text-sm font-mono text-zinc-300 leading-relaxed">
              {capacity.availableHolidays > 0 ? (
                <>
                  You can safely take <strong className="text-white">{capacity.availableHolidays} full working day{capacity.availableHolidays > 1 ? "s" : ""} off</strong> without dropping your average below the <strong className="text-accent-cyan">8.0h/workday</strong> standard.
                </>
              ) : (
                <>
                  <strong className="text-white">0 holidays available</strong> without dropping below the 8.0h/workday standard. Every holiday taken now will create an 8.0h deficit requiring planned recovery.
                </>
              )}
            </p>
          </div>

          {/* Core HUD Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono shrink-0">
            <div className="bg-black/60 border border-border-subtle p-3 rounded-lg">
              <span className="text-[9px] uppercase text-zinc-500 block">Workday Average</span>
              <span className={`text-xl font-bold ${capacity.currentAverage >= 8.0 ? "text-emerald-400" : "text-amber-400"}`}>
                {capacity.currentAverage.toFixed(1)}h
              </span>
              <span className="text-[9px] text-zinc-600 block mt-0.5">Target: 8.0h/day</span>
            </div>

            <div className="bg-black/60 border border-border-subtle p-3 rounded-lg">
              <span className="text-[9px] uppercase text-zinc-500 block">Usable Surplus</span>
              <span className={`text-xl font-bold ${capacity.surplusHours > 0 ? "text-accent-cyan" : "text-zinc-500"}`}>
                +{capacity.surplusHours.toFixed(1)}h
              </span>
              <span className="text-[9px] text-zinc-600 block mt-0.5">
                {capacity.deficitHours > 0 ? `Deficit: -${capacity.deficitHours.toFixed(1)}h` : "Above baseline"}
              </span>
            </div>

            <div className="bg-black/60 border border-border-subtle p-3 rounded-lg col-span-2 sm:col-span-1">
              <span className="text-[9px] uppercase text-zinc-500 block">Month Workdays</span>
              <span className="text-xl font-bold text-white">
                {capacity.elapsedWorkdays}
                <span className="text-xs text-zinc-500 font-normal"> / +{capacity.remainingWorkdaysInMonth} left</span>
              </span>
              <span className="text-[9px] text-zinc-600 block mt-0.5">Excludes Sat & Sun</span>
            </div>
          </div>
        </div>

        {/* Informational Footer Strip */}
        <div className="mt-6 pt-4 border-t border-border-subtle/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-[11px] font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
            <span>
              <strong>Rule:</strong> Saturday and Sunday are default non-working days. Taking off on a weekend costs 0 hours and requires 0 recovery.
            </span>
          </div>
          <span className="text-zinc-500 text-[10px]">
            Projected average if all {capacity.availableHolidays} days taken:{" "}
            <strong className="text-zinc-300 font-bold">{capacity.projectedAverageAfterHolidays.toFixed(1)}h/workday</strong>
          </span>
        </div>
      </div>

      {/* 3. INTERACTIVE HOLIDAY CALCULATOR & RECOVERY SIMULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Controls */}
        <div className="lg:col-span-5 space-y-6">
          <Panel className="space-y-6 p-6">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div>
                <h2 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent-cyan" /> Recovery Simulator
                </h2>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  Simulate planned holidays and calculate exact recovery trajectory.
                </p>
              </div>
              {simulating && (
                <span className="text-[9px] font-mono text-accent-cyan animate-pulse">
                  CALCULATING...
                </span>
              )}
            </div>

            {/* Input 1: Number of Holidays */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-400">Planned Holidays:</span>
                <span className="text-white font-bold text-sm bg-zinc-900 px-2 py-0.5 rounded border border-border-subtle">
                  {holidays} {holidays === 1 ? "Day" : "Days"} ({holidays * 8}h deficit)
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 font-mono text-xs">
                {[1, 2, 3, 5, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => setHolidays(num)}
                    className={`py-1.5 rounded text-center transition-all ${
                      holidays === num
                        ? "bg-accent-cyan text-black font-bold shadow-md shadow-accent-cyan/20"
                        : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-border-subtle"
                    }`}
                  >
                    {num}d
                  </button>
                ))}
              </div>
              <div className="pt-1">
                <Slider
                  min="0"
                  max="20"
                  step="1"
                  value={holidays}
                  onChange={(e) => setHolidays(Number(e.target.value))}
                  label="Custom Days Off"
                  suffix=" days"
                />
              </div>
            </div>

            {/* Input 2: Planned Daily Hours during Recovery */}
            <div className="space-y-2.5 pt-2 border-t border-border-subtle/50">
              <div className="flex justify-between items-center text-xs font-mono">
                <div>
                  <span className="text-zinc-400 block">Planned Daily Pace:</span>
                  <span className="text-[10px] text-zinc-600 block">Cap: 10.0h planning ceiling</span>
                </div>
                <div className="text-right">
                  <span className={`text-base font-bold ${plannedDailyHours >= 10.0 ? "text-amber-400" : "text-white"}`}>
                    {plannedDailyHours.toFixed(1)}h
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    (+{(plannedDailyHours - 8.0).toFixed(1)}h surplus/day)
                  </span>
                </div>
              </div>
              <Slider
                min="8.0"
                max="10.0"
                step="0.5"
                value={plannedDailyHours}
                onChange={(e) => setPlannedDailyHours(Number(e.target.value))}
                label="Daily Workday Hours"
                suffix="h/day"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                <span>8.0h (Standard)</span>
                <span>8.5h</span>
                <span>9.0h (Recommended)</span>
                <span>9.5h</span>
                <span className="text-amber-400">10.0h (Ceiling)</span>
              </div>
            </div>

            {/* Input 3: Weekend Recovery Toggle */}
            <div className="pt-2 border-t border-border-subtle/50 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-zinc-300 block">Weekend Recovery Mode</span>
                  <span className="text-[10px] font-mono text-zinc-500 block">
                    Use Saturday & Sunday for recovery work
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludeWeekends(!includeWeekends)}
                  className={`px-3 py-1 text-xs font-mono font-bold rounded transition-all border ${
                    includeWeekends
                      ? "bg-accent-cyan/20 border-accent-cyan text-accent-cyan"
                      : "bg-zinc-900 border-border-subtle text-zinc-400 hover:text-white"
                  }`}
                >
                  {includeWeekends ? "ENABLED" : "DISABLED"}
                </button>
              </div>
              <p className="text-[10px] font-mono text-zinc-500 leading-tight">
                {includeWeekends
                  ? "Sat & Sun will count as pure recovery days at your planned daily pace."
                  : "Recovery happens strictly on standard Monday–Friday workdays."}
              </p>
            </div>

            {/* Quick Reset */}
            <div className="pt-3 border-t border-border-subtle/50 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setHolidays(2);
                  setPlannedDailyHours(9.0);
                  setIncludeWeekends(false);
                }}
                className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset Defaults
              </button>
            </div>
          </Panel>
        </div>

        {/* Right Column: Simulation Outcomes */}
        <div className="lg:col-span-7 space-y-6">
          {simResult && (
            <>
              {/* Perspective 1: Maintaining the Ideal */}
              <Panel className="p-6 space-y-4 border-l-4 border-l-accent-cyan">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={`w-4 h-4 ${
                        simResult.maintainsIdeal ? "text-emerald-400" : "text-amber-400"
                      }`}
                    />
                    <h3 className="text-xs font-mono font-bold uppercase text-white">
                      Perspective 1: Maintaining the 8.0h Ideal
                    </h3>
                  </div>
                  <Badge
                    variant={simResult.maintainsIdeal ? "cyan" : "warning"}
                    className="text-[9px] uppercase font-mono font-bold"
                  >
                    {simResult.maintainsIdeal ? "MAINTAINS IDEAL" : "DROPS BELOW 8.0H"}
                  </Badge>
                </div>

                <p className="text-xs font-mono text-zinc-300 leading-relaxed">
                  {simResult.idealMaintenanceMessage}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs pt-1">
                  <div className="bg-zinc-950 p-2.5 rounded border border-border-subtle">
                    <span className="text-[9px] text-zinc-500 uppercase block">Deficit Created</span>
                    <span className="text-white font-bold text-sm">
                      -{simResult.holidayDeficitHours.toFixed(1)}h
                    </span>
                    <span className="text-[9px] text-zinc-600 block">
                      {simResult.holidays} × 8.0h
                    </span>
                  </div>

                  <div className="bg-zinc-950 p-2.5 rounded border border-border-subtle">
                    <span className="text-[9px] text-zinc-500 uppercase block">Projected Average</span>
                    <span
                      className={`font-bold text-sm ${
                        simResult.projectedAverageAfterHolidays >= 8.0
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {simResult.projectedAverageAfterHolidays.toFixed(1)}h/day
                    </span>
                    <span className="text-[9px] text-zinc-600 block">Post-holiday</span>
                  </div>

                  <div className="bg-zinc-950 p-2.5 rounded border border-border-subtle col-span-2 sm:col-span-1">
                    <span className="text-[9px] text-zinc-500 uppercase block">Recovery Required?</span>
                    <span
                      className={`font-bold text-sm ${
                        simResult.maintainsIdeal ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {simResult.maintainsIdeal ? "None" : "Yes (To Ideal)"}
                    </span>
                    <span className="text-[9px] text-zinc-600 block">8.0h standard</span>
                  </div>
                </div>
              </Panel>

              {/* Perspective 2: Returning to Pre-Holiday Position */}
              <Panel className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-mono font-bold uppercase text-white">
                      Perspective 2: Returning to Current Pre-Holiday Position
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Deficit to recover: {simResult.totalDeficitToRecover.toFixed(1)}h
                  </span>
                </div>

                {/* Trajectory Highlights */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
                  <div className="bg-zinc-950 p-3 rounded-lg border border-border-subtle">
                    <span className="text-[9px] uppercase text-zinc-500 block">Workdays to Recover</span>
                    <span className="text-2xl font-bold text-white">
                      {simResult.recoveryWorkdaysRequired}
                    </span>
                    <span className="text-[9px] text-zinc-600 block mt-0.5">
                      {simResult.includeWeekends ? "Active days" : "Mon–Fri workdays"}
                    </span>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-lg border border-border-subtle">
                    <span className="text-[9px] uppercase text-zinc-500 block">Calendar Time</span>
                    <span className="text-2xl font-bold text-accent-cyan">
                      {simResult.recoveryWeeks}
                      <span className="text-xs font-normal text-zinc-400"> wks</span>
                    </span>
                    <span className="text-[9px] text-zinc-600 block mt-0.5">
                      ({simResult.recoveryCalendarDays} calendar days)
                    </span>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-lg border border-border-subtle col-span-2">
                    <span className="text-[9px] uppercase text-zinc-500 block">Projected Recovery Date</span>
                    <span className="text-xl font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-4 h-4 shrink-0 text-emerald-400" />
                      {simResult.projectedRecoveryDate}
                    </span>
                    <span className="text-[9px] text-zinc-500 block mt-0.5">
                      Full restoration to pre-holiday surplus
                    </span>
                  </div>
                </div>

                {/* Daily Recovery Breakdown */}
                <div className="bg-zinc-950/60 border border-border-subtle p-3 rounded text-[11px] font-mono space-y-1.5 text-zinc-400">
                  <div className="flex justify-between">
                    <span>Daily Planned Pace:</span>
                    <span className="text-white font-bold">{simResult.dailyRecoveryTarget.toFixed(1)}h/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weekday Recovery Contribution:</span>
                    <span className="text-emerald-400">+{simResult.dailyWeekdaySurplus.toFixed(1)}h / workday</span>
                  </div>
                  {simResult.includeWeekends && (
                    <div className="flex justify-between">
                      <span>Weekend Recovery Contribution:</span>
                      <span className="text-accent-cyan">+{simResult.weekendDailyRecoveryHours.toFixed(1)}h / weekend day</span>
                    </div>
                  )}
                </div>

                {/* Warnings / Feasibility */}
                {simResult.warningMessage && (
                  <div className="bg-amber-950/30 border border-amber-500/40 p-4 rounded-lg flex items-start gap-3 text-xs font-mono text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold uppercase block text-amber-300">Plan Feasibility Notice</span>
                      <span className="text-[11px] text-amber-200/90 leading-relaxed block mt-0.5">
                        {simResult.warningMessage}
                      </span>
                    </div>
                  </div>
                )}
              </Panel>
            </>
          )}
        </div>

      </div>

      {/* 4. WORKWEEK POLICY FOOTNOTE */}
      <div className="bg-zinc-950 border border-border-subtle p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-[11px] font-mono text-zinc-500">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
          <span>
            Cyber Tracker 5-Day Workweek Policy: Normal target is 40.0h/week (8.0h Mon–Fri). All predictions respect realistic physical ceilings.
          </span>
        </div>
        <span className="text-zinc-600">Simulations are non-destructive and instantaneous.</span>
      </div>
    </div>
  );
}