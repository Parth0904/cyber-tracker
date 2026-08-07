"use client";

import * as React from "react";
import { SlidersHorizontal, CopyMinus, CheckCircle2, Flame, BookOpen, Clock, FileText, Sun } from "lucide-react";
import { mapEntryToDailyForm } from "@/lib/mappers/dailyForm";
import { Button } from "@/components/ui/Button";

type DailyForm = {
  bedTime: string;
  wakeTime: string;
  workout: boolean;
  reading: boolean;
  mobileScreenTime: number | null;
  notes: string;
};

const DEFAULT_FORM: DailyForm = {
  bedTime: "23:00",
  wakeTime: "07:00",
  workout: false,
  reading: false,
  mobileScreenTime: null,
  notes: "",
};

// Conversions & UX time manipulation helpers
function convert12hTo24h(time12h: string): string {
  const [time, modifier] = time12h.split(" ");
  const [hStr, mStr] = time.split(":");
  let hours = Number(hStr);
  const minutes = Number(mStr);
  if (modifier === "PM" && hours < 12) {
    hours += 12;
  }
  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function adjustTime(timeStr: string, diffMinutes: number): string {
  if (!timeStr) timeStr = "12:00";
  const [hours, minutes] = timeStr.split(":").map(Number);
  let totalMinutes = hours * 60 + minutes + diffMinutes;
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }
  totalMinutes = totalMinutes % (24 * 60);
  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`;
}

function getCurrentLocalTime(): string {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatMinutesToDuration(mins: number | null): string {
  if (mins === null || mins === undefined) return "Not Logged";
  if (mins >= 480) return "8h+";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function DailyHabitsForm() {
  const [initialState, setInitialState] = React.useState<DailyForm>({ ...DEFAULT_FORM });
  const [currentState, setCurrentState] = React.useState<DailyForm>({ ...DEFAULT_FORM });

  const [hasChanges, setHasChanges] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isCloning, setIsCloning] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(true);
  const [hasSubmittedToday, setHasSubmittedToday] = React.useState(false);

  async function loadTodayHabits() {
    try {
      const res = await fetch("/api/daily");
      if (!res.ok) return;

      const data = await res.json();
      if (data && Object.keys(data).length > 0) {
        const form = mapEntryToDailyForm(data);
        setInitialState(form);
        setCurrentState(form);

        if (form.bedTime || form.wakeTime || form.notes || form.reading || form.workout || form.mobileScreenTime !== null) {
          setHasSubmittedToday(true);
          setIsEditing(false);
        }
      } else {
        setInitialState({ ...DEFAULT_FORM });
        setCurrentState({ ...DEFAULT_FORM });
        setHasSubmittedToday(false);
        setIsEditing(true);
      }
    } catch (err) {
      console.error("Failed to load today's habits:", err);
    }
  }

  React.useEffect(() => {
    loadTodayHabits();
  }, []);

  React.useEffect(() => {
    setHasChanges(JSON.stringify(initialState) !== JSON.stringify(currentState));
  }, [currentState, initialState]);

  const updateField = (fields: Partial<DailyForm>) => {
    setCurrentState((prev) => ({ ...prev, ...fields }));
  };

  const handleCloneYesterday = async () => {
    setIsCloning(true);
    try {
      const res = await fetch("/api/history/summary?scope=yesterday");
      if (!res.ok) return;

      const data = await res.json();
      if (data && Object.keys(data).length > 0) {
        const form = mapEntryToDailyForm(data);
        setCurrentState({
          bedTime: form.bedTime || "23:00",
          wakeTime: form.wakeTime || "07:00",
          workout: Boolean(form.workout),
          reading: Boolean(form.reading),
          mobileScreenTime: form.mobileScreenTime,
          notes: form.notes || "",
        });
      }
    } catch (err) {
      console.error("Failed to clone yesterday:", err);
    } finally {
      setIsCloning(false);
    }
  };

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentState),
      });

      if (!res.ok) throw new Error("Save failed");

      setInitialState({ ...currentState });
      setHasSubmittedToday(true);
      setIsEditing(false);

      // Dispatch events to dynamically update consistency theme and dashboard data
      window.dispatchEvent(new Event("refresh-consistency-theme"));
      window.dispatchEvent(new Event("refresh-dashboard-data"));
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (hasSubmittedToday && !isEditing) {
    return (
      <div className="border border-border-subtle bg-black/40 rounded-xl p-6 font-mono text-xs text-zinc-300 space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2 text-success-emerald">
            <CheckCircle2 size={16} className="text-accent-cyan animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-[10px] text-white">Daily Ingestion Checked</span>
          </div>
          <Button
            variant="secondary"
            onClick={() => setIsEditing(true)}
            className="h-7 text-[10px] uppercase font-bold hover:border-accent-cyan"
          >
            Edit Ingestion
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-zinc-950/60 border border-zinc-900 p-3 rounded-lg">
            <span className="text-[9px] text-zinc-500 uppercase block mb-1">Bed Time</span>
            <span className="text-white font-bold text-xs flex items-center gap-1">
              <Clock size={12} className="text-zinc-500" />
              {currentState.bedTime || "Not Logged"}
            </span>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-900 p-3 rounded-lg">
            <span className="text-[9px] text-zinc-500 uppercase block mb-1">Wake Time</span>
            <span className="text-white font-bold text-xs flex items-center gap-1">
              <Sun size={12} className="text-zinc-500" />
              {currentState.wakeTime || "Not Logged"}
            </span>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-900 p-3 rounded-lg">
            <span className="text-[9px] text-zinc-500 uppercase block mb-1">Workout</span>
            <span className="text-white font-bold text-xs flex items-center gap-1">
              <Flame size={12} className="text-danger-rose" />
              {currentState.workout ? "Complete" : "Incomplete"}
            </span>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-900 p-3 rounded-lg">
            <span className="text-[9px] text-zinc-500 uppercase block mb-1">Reading</span>
            <span className="text-white font-bold text-xs flex items-center gap-1">
              <BookOpen size={12} className="text-accent-cyan" />
              {currentState.reading ? "Completed" : "Skipped"}
            </span>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-900 p-3 rounded-lg">
            <span className="text-[9px] text-zinc-500 uppercase block mb-1">Screen Time</span>
            <span className="text-white font-bold text-xs flex items-center gap-1">
              <Clock size={12} className="text-zinc-500" />
              {formatMinutesToDuration(currentState.mobileScreenTime)}
            </span>
          </div>
        </div>

        {currentState.notes && (
          <div className="bg-zinc-950/60 border border-zinc-900 p-3.5 rounded-lg space-y-1">
            <span className="text-[9px] text-zinc-500 uppercase block">Daily Log Notes</span>
            <p className="text-zinc-400 font-sans text-xs leading-relaxed">{currentState.notes}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border border-border-subtle bg-black/40 rounded-xl p-5 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={12} className="text-accent-cyan" />
          <h2 className="text-white font-bold tracking-wider uppercase text-[10px]">
            Daily Ingestion Control
          </h2>
        </div>
        <button
          type="button"
          onClick={handleCloneYesterday}
          disabled={isCloning}
          className="flex items-center gap-1.5 bg-zinc-950 border border-border-subtle px-2.5 py-1.5 rounded text-[9px] text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer font-bold disabled:opacity-50"
        >
          <CopyMinus size={11} /> CLONE YESTERDAY
        </button>
      </div>

      <form onSubmit={handleCommit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* BED TIME */}
          <div className="border border-zinc-900 bg-zinc-950/40 rounded-lg p-3.5 space-y-3 flex flex-col justify-between">
            <label className="text-[9px] text-zinc-500 uppercase flex items-center gap-1 font-bold">
              <Clock size={12} className="text-accent-cyan" /> Bed Time
            </label>
            <div className="flex gap-1.5 items-center">
              <button
                type="button"
                onClick={() => updateField({ bedTime: adjustTime(currentState.bedTime, -30) })}
                className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:text-white text-zinc-400 px-2 py-1.5 rounded text-[10px] font-bold cursor-pointer transition-colors"
              >
                -30m
              </button>
              <input
                type="time"
                value={currentState.bedTime || ""}
                onChange={(e) => updateField({ bedTime: e.target.value })}
                className="flex-1 bg-black border border-border-subtle rounded p-1.5 text-zinc-200 focus:outline-none focus:border-accent-cyan font-mono text-xs text-center min-w-[70px]"
                required
              />
              <button
                type="button"
                onClick={() => updateField({ bedTime: adjustTime(currentState.bedTime, 30) })}
                className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:text-white text-zinc-400 px-2 py-1.5 rounded text-[10px] font-bold cursor-pointer transition-colors"
              >
                +30m
              </button>
            </div>
            <button
              type="button"
              onClick={() => updateField({ bedTime: getCurrentLocalTime() })}
              className="w-full bg-zinc-950 border border-border-subtle/50 text-zinc-500 hover:text-white hover:border-zinc-700 py-1 rounded text-[8px] uppercase tracking-wider font-bold transition-all cursor-pointer"
            >
              Current Time
            </button>
            <div className="grid grid-cols-3 gap-1 pt-1">
              {["9:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM", "12:00 AM"].map((time) => {
                const time24h = convert12hTo24h(time);
                const isSelected = currentState.bedTime === time24h;
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => updateField({ bedTime: time24h })}
                    className={`py-1 rounded-[3px] text-[8px] font-mono transition-all cursor-pointer font-bold border ${
                      isSelected
                        ? "bg-accent-cyan/10 border-accent-cyan text-accent-cyan"
                        : "bg-black/40 border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>

          {/* WAKE TIME */}
          <div className="border border-zinc-900 bg-zinc-950/40 rounded-lg p-3.5 space-y-3 flex flex-col justify-between">
            <label className="text-[9px] text-zinc-500 uppercase flex items-center gap-1 font-bold">
              <Sun size={12} className="text-warning-amber animate-pulse" /> Wake Time
            </label>
            <div className="flex gap-1.5 items-center">
              <button
                type="button"
                onClick={() => updateField({ wakeTime: adjustTime(currentState.wakeTime, -30) })}
                className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:text-white text-zinc-400 px-2 py-1.5 rounded text-[10px] font-bold cursor-pointer transition-colors"
              >
                -30m
              </button>
              <input
                type="time"
                value={currentState.wakeTime || ""}
                onChange={(e) => updateField({ wakeTime: e.target.value })}
                className="flex-1 bg-black border border-border-subtle rounded p-1.5 text-zinc-200 focus:outline-none focus:border-accent-cyan font-mono text-xs text-center min-w-[70px]"
                required
              />
              <button
                type="button"
                onClick={() => updateField({ wakeTime: adjustTime(currentState.wakeTime, 30) })}
                className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:text-white text-zinc-400 px-2 py-1.5 rounded text-[10px] font-bold cursor-pointer transition-colors"
              >
                +30m
              </button>
            </div>
            <button
              type="button"
              onClick={() => updateField({ wakeTime: getCurrentLocalTime() })}
              className="w-full bg-zinc-950 border border-border-subtle/50 text-zinc-500 hover:text-white hover:border-zinc-700 py-1 rounded text-[8px] uppercase tracking-wider font-bold transition-all cursor-pointer"
            >
              Current Time
            </button>
            <div className="grid grid-cols-3 gap-1 pt-1">
              {["5:30 AM", "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", "8:00 AM"].map((time) => {
                const time24h = convert12hTo24h(time);
                const isSelected = currentState.wakeTime === time24h;
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => updateField({ wakeTime: time24h })}
                    className={`py-1 rounded-[3px] text-[8px] font-mono transition-all cursor-pointer font-bold border ${
                      isSelected
                        ? "bg-accent-cyan/10 border-accent-cyan text-accent-cyan"
                        : "bg-black/40 border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MOBILE SCREEN TIME */}
          <div className="border border-zinc-900 bg-zinc-950/40 rounded-lg p-3.5 space-y-3 flex flex-col justify-between">
            <label className="text-[9px] text-zinc-500 uppercase flex items-center gap-1 font-bold">
              <Clock size={12} className="text-zinc-500" /> Mobile Screen Time
            </label>
            <div className="flex gap-1.5 items-center">
              <button
                type="button"
                onClick={() => updateField({ mobileScreenTime: Math.max(0, (currentState.mobileScreenTime || 0) - 30) })}
                className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:text-white text-zinc-400 px-2 py-1.5 rounded text-[10px] font-bold cursor-pointer transition-colors"
              >
                -30m
              </button>
              <select
                value={currentState.mobileScreenTime ?? ""}
                onChange={(e) => updateField({ mobileScreenTime: e.target.value === "" ? null : Number(e.target.value) })}
                className="flex-1 bg-black border border-border-subtle rounded p-1.5 text-zinc-200 focus:outline-none focus:border-accent-cyan font-mono text-xs text-center cursor-pointer min-w-[70px]"
              >
                <option value="">-- Not Logged --</option>
                {[
                  { val: 30, label: "0h 30m" },
                  { val: 60, label: "1h" },
                  { val: 90, label: "1h 30m" },
                  { val: 120, label: "2h" },
                  { val: 150, label: "2h 30m" },
                  { val: 180, label: "3h" },
                  { val: 240, label: "4h" },
                  { val: 300, label: "5h" },
                  { val: 360, label: "6h" },
                  { val: 420, label: "7h" },
                  { val: 480, label: "8h+" },
                ].map((item) => (
                  <option key={item.val} value={item.val}>
                    {item.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => updateField({ mobileScreenTime: Math.min(480, (currentState.mobileScreenTime || 0) + 30) })}
                className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:text-white text-zinc-400 px-2 py-1.5 rounded text-[10px] font-bold cursor-pointer transition-colors"
              >
                +30m
              </button>
            </div>
            <div className="text-center text-[9px] text-zinc-500 font-bold">
              CURRENT // <span className="text-white">{formatMinutesToDuration(currentState.mobileScreenTime)}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 pt-1">
              {[
                { val: 30, label: "30m" },
                { val: 60, label: "1h" },
                { val: 120, label: "2h" },
                { val: 180, label: "3h" },
                { val: 240, label: "4h" },
                { val: 300, label: "5h" },
                { val: 360, label: "6h" },
                { val: 480, label: "8h" }
              ].map((chip) => {
                const isSelected = currentState.mobileScreenTime === chip.val;
                return (
                  <button
                    key={chip.val}
                    type="button"
                    onClick={() => updateField({ mobileScreenTime: chip.val })}
                    className={`py-1 rounded-[3px] text-[8px] font-mono transition-all cursor-pointer font-bold border ${
                      isSelected
                        ? "bg-accent-cyan/10 border-accent-cyan text-accent-cyan"
                        : "bg-black/40 border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800"
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* WORKOUT */}
          <div className="border border-zinc-900 bg-zinc-950/40 rounded-lg p-3.5 flex flex-col justify-between">
            <label className="text-[9px] text-zinc-500 uppercase flex items-center gap-1 mb-1 font-bold">
              <Flame size={12} className="text-danger-rose" /> Workout Completed
            </label>
            <div className="flex items-center justify-between bg-black/50 border border-zinc-900 p-2.5 rounded-lg">
              <span className="text-[10px] text-zinc-400 uppercase font-bold">Workout ✅</span>
              <input
                type="checkbox"
                checked={currentState.workout}
                onChange={(e) => updateField({ workout: e.target.checked })}
                className="w-5 h-5 bg-zinc-950 border-border-subtle rounded text-accent-cyan focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
            </div>
          </div>

          {/* READING */}
          <div className="border border-zinc-900 bg-zinc-950/40 rounded-lg p-3.5 flex flex-col justify-between">
            <label className="text-[9px] text-zinc-500 uppercase flex items-center gap-1 mb-1 font-bold">
              <BookOpen size={12} className="text-accent-cyan" /> Reading Daily
            </label>
            <div className="flex items-center justify-between bg-black/50 border border-zinc-900 p-2.5 rounded-lg">
              <span className="text-[10px] text-zinc-400 uppercase font-bold">Reading ✅</span>
              <input
                type="checkbox"
                checked={currentState.reading}
                onChange={(e) => updateField({ reading: e.target.checked })}
                className="w-5 h-5 bg-zinc-950 border-border-subtle rounded text-accent-cyan focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* DAILY LOG NOTES */}
        <div className="border border-zinc-900 bg-zinc-950/40 rounded-lg p-3.5 space-y-2">
          <label className="text-[9px] text-zinc-500 uppercase flex items-center gap-1 font-bold">
            <FileText size={12} className="text-zinc-500" /> Daily Log Statement
          </label>
          <textarea
            placeholder="Log your challenges, focus, and state..."
            value={currentState.notes || ""}
            onChange={(e) => updateField({ notes: e.target.value })}
            className="w-full h-16 bg-black border border-border-subtle rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-accent-cyan resize-none leading-relaxed font-sans"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {hasSubmittedToday && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCurrentState({ ...initialState });
                setIsEditing(false);
              }}
              className="h-8 font-bold text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving || !hasChanges}
            className="h-8 bg-accent-cyan text-black hover:opacity-90 font-bold border-accent-cyan focus:ring-accent-cyan"
          >
            {isSaving ? "INGESTING..." : "COMMIT INGESTION"}
          </Button>
        </div>
      </form>
    </div>
  );
}