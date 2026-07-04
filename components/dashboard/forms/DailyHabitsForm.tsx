"use client";

import * as React from "react";
import { SlidersHorizontal, CopyMinus } from "lucide-react";
import { HealthCard } from "./HealthCard";
import { RecoveryCard } from "./RecoveryCard";
import { MindCard } from "./MindCard";
import { JournalCard } from "./JournalCard";
import { SaveBar } from "./SaveBar";
import { mapEntryToDailyForm } from "@/lib/mappers/dailyForm";

type DailyForm = {
  sleep: number;
  bedTime: string;
  reading: boolean;
  focusFeeling: number;
  workout: boolean;
  steps: number;
  notes: string;
};

const DEFAULT_FORM: DailyForm = {
  sleep: 7,
  bedTime: "23:00",
  reading: false,
  focusFeeling: 3,
  workout: false,
  steps: 0,
  notes: "",
};

export function DailyHabitsForm() {
  const [initialState, setInitialState] = React.useState<DailyForm>({ ...DEFAULT_FORM });
  const [currentState, setCurrentState] = React.useState<DailyForm>({ ...DEFAULT_FORM });

  const [hasChanges, setHasChanges] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [isCloning, setIsCloning] = React.useState(false);

  React.useEffect(() => {
    async function loadTodayHabits() {
      try {
        const res = await fetch("/api/daily");
        if (!res.ok) return;

        const data = await res.json();
        if (data && Object.keys(data).length > 0) {
          const form = mapEntryToDailyForm(data);
          setInitialState(form);
          setCurrentState(form);
        } else {
          setInitialState({ ...DEFAULT_FORM });
          setCurrentState({ ...DEFAULT_FORM });
        }
      } catch (err) {
        console.error("Failed to load today's habits:", err);
      }
    }
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
        setCurrentState(form);
      }
    } catch (err) {
      console.error("Failed to clone yesterday:", err);
    } finally {
      setIsCloning(false);
    }
  };

  const handleCommit = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentState),
      });

      if (!res.ok) throw new Error("Save failed");

      setInitialState({ ...currentState });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative border-2 border-zinc-800 bg-zinc-950/80 rounded-xl overflow-hidden shadow-2xl">
      <div className="bg-zinc-900 px-4 py-3 border-b border-border-subtle flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={12} className="text-accent-cyan" />
          <h2 className="text-white font-bold tracking-wider uppercase text-[11px]">
            DAILY METRIC INGESTION
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCloneYesterday}
            className="flex items-center gap-1.5 bg-black border border-border-subtle px-2.5 py-1 rounded text-[10px] text-zinc-400"
          >
            <CopyMinus size={11} /> CLONE YESTERDAY
          </button>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthCard data={currentState} onChange={updateField} />
        <RecoveryCard data={currentState} onChange={updateField} />
        <MindCard data={currentState} onChange={updateField} />
        <JournalCard data={currentState} onChange={updateField} />
      </div>

      <SaveBar
        isVisible={hasChanges}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        onSave={handleCommit}
        onDiscard={() => setCurrentState({ ...initialState })}
      />
    </div>
  );
}