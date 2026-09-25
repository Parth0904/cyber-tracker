"use client";

import * as React from "react";
import { SlidersHorizontal, CopyMinus, CheckCircle2, FileText } from "lucide-react";
import { mapEntryToDailyForm } from "@/lib/mappers/dailyForm";
import { Button } from "@/components/ui/Button";

type DailyForm = {
  notes: string;
};

const DEFAULT_FORM: DailyForm = {
  notes: "",
};

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

        if (form.notes) {
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
      console.error("Failed to load today's daily log:", err);
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

      // Dispatch event to update dashboard data
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
            <span className="font-bold uppercase tracking-wider text-[10px] text-white">Daily Log Recorded</span>
          </div>
          <Button
            variant="secondary"
            onClick={() => setIsEditing(true)}
            className="h-7 text-[10px] uppercase font-bold hover:border-accent-cyan"
          >
            Edit Log
          </Button>
        </div>

        {currentState.notes ? (
          <div className="bg-zinc-950/60 border border-zinc-900 p-3.5 rounded-lg space-y-1">
            <span className="text-[9px] text-zinc-500 uppercase block font-bold">Daily Log Statement</span>
            <p className="text-zinc-300 font-sans text-xs leading-relaxed">{currentState.notes}</p>
          </div>
        ) : (
          <p className="text-zinc-500 italic">No notes logged for today.</p>
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
            Daily Log Ingestion
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
        {/* DAILY LOG NOTES */}
        <div className="border border-zinc-900 bg-zinc-950/40 rounded-lg p-3.5 space-y-2">
          <label className="text-[9px] text-zinc-500 uppercase flex items-center gap-1 font-bold">
            <FileText size={12} className="text-zinc-500" /> Daily Log Statement
          </label>
          <textarea
            placeholder="Log your challenges, focus, and state..."
            value={currentState.notes || ""}
            onChange={(e) => updateField({ notes: e.target.value })}
            className="w-full h-20 bg-black border border-border-subtle rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-accent-cyan resize-none leading-relaxed font-sans"
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
            {isSaving ? "INGESTING..." : "COMMIT LOG"}
          </Button>
        </div>
      </form>
    </div>
  );
}